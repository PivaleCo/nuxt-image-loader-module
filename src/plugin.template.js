import Vue from 'vue'

/**
 * Return a path prefix to append to source.
 *
 * Static generation requires a relative path to traverse up if the request path is nested.
 *
 * If route is / return ''
 * If route is one level deep: returns '../'
 * If route is two levels deep: returns '../../'
 * etc.
 */
const getRelativeBasePath = function (routerPath) {
  const routerPathDepth = routerPath === '/' ? 0 : routerPath.substring(1).split('/').length
  return routerPathDepth === 0 ? '' : Array(routerPathDepth).fill('..').join('/') + '/'
}

const validateImageStyle = function (style, contextString = '') {
  const validImageStyles = [<%= options.validImageStyles.map(x => "'" + x + "'") %>]

  if (!validImageStyles.includes(style)) {
    console.error(`Invalid image style: ${style} ${contextString}`)
    return false
  }
  return true
}

const validateResponsiveStyle = function (responsiveStyle) {
  const validResponsiveStyles = [<%= options.validResponsiveStyles.map(x => "'" + x + "'") %>]

  if (!validResponsiveStyles.includes(responsiveStyle)) {
    console.error(`Invalid responsive style: ${responsiveStyle}`)
    return false
  }

  const responsiveStyleDefinition = getResponsiveStyleDefinition(responsiveStyle)

  if (!responsiveStyleDefinition.srcset) {
    console.error(`${responsiveStyle} responsive style is missing a srcset property`)
    return false
  }

  let imageStyleErrors = false

  responsiveStyleDefinition.srcset.split(',').forEach(srcsetComponent => {
    srcsetComponent = srcsetComponent.trim()
    const [imageStyle, _] = srcsetComponent.split(' ')
    const imageStyleValidates = validateImageStyle(imageStyle, `in ${responsiveStyle} responsive style definition`)
    if (!imageStyleValidates) {
      imageStyleErrors = true
    }
  })

  if (imageStyleErrors) {
    return false
  }

  return true
}

/**
 * Get responsive style definition from responsive style name.
 */
const getResponsiveStyleDefinition = function (responsiveStyleName) {
  const responsiveStyles = <%= JSON.stringify(options.responsiveStyles) %>
  return responsiveStyles[responsiveStyleName]
}

/**
 * Process a src attribute for static generation.
 */
const processSrcImageStyleStatic = function (src, style, routerPath) {
  const relativeBasePath = getRelativeBasePath(routerPath)

  if (style !== null) {
    if (!validateImageStyle(style)) {
      // Fallback to using original image.
      return relativeBasePath + 'image-styles' + src.split('?')[0]
    }

    const splitPath = src.split('.')
    const filenameIndex = splitPath.length - 2
    splitPath[filenameIndex] = splitPath[filenameIndex] + '--' + style
    const fullPath = splitPath.join('.')
    const srcStrippedQuery = fullPath.split('?')[0]
    return relativeBasePath + 'image-styles' + srcStrippedQuery
  }

  return relativeBasePath + 'image-styles' + src
}

/**
 * Process a src, srcset and sizes attributes for static generation.
 */
const processSrcResponsiveStyleStatic = function (src, responsiveStyle, routerPath) {
  const relativeBasePath = getRelativeBasePath(routerPath)

  const attributes = {
    src: '',
    srcset: '',
    sizes: ''
  }

  attributes.src = relativeBasePath + 'image-styles' + src.split('?')[0]

  if (responsiveStyle !== null) {

    if (!validateResponsiveStyle(responsiveStyle)) {
      // Fallback to using original image as defined above and don't set srcset
      // or sizes attributes.
      return attributes
    }

    const responsiveStyleDefinition = getResponsiveStyleDefinition(responsiveStyle)

    const computedSrcset = []

    responsiveStyleDefinition.srcset.split(',').forEach(srcsetComponent => {
      srcsetComponent = srcsetComponent.trim()
      const [imageStyle, breakpoint] = srcsetComponent.split(' ')

      const splitPath = src.split('.')
      const filenameIndex = splitPath.length - 2
      splitPath[filenameIndex] = splitPath[filenameIndex] + '--' + imageStyle
      const fullPath = splitPath.join('.')
      const srcStrippedQuery = fullPath.split('?')[0]

      computedSrcset.push(`${relativeBasePath}image-styles${srcStrippedQuery} ${breakpoint}`)
    })

    if (responsiveStyleDefinition.sizes) {
      attributes.sizes = responsiveStyleDefinition.sizes
    }

    attributes.srcset = computedSrcset.join(', ')
  }

  return attributes
}

/**
 * Process a src, srcset and sizes attributes for non-static generation.
 */
const processSrcResponsiveStyleNonStatic = function (src, responsiveStyle) {

  const attributes = {
    src: '',
    srcset: '',
    sizes: ''
  }

  attributes.src = src.split('?')[0]

  if (responsiveStyle !== null) {

    if (!validateResponsiveStyle(responsiveStyle)) {
      // Fallback to using original image as defined above and don't set srcset
      // or sizes attributes.
      return attributes
    }

    const responsiveStyleDefinition = getResponsiveStyleDefinition(responsiveStyle)

    const computedSrcset = []

    responsiveStyleDefinition.srcset.split(',').forEach(srcsetComponent => {
      srcsetComponent = srcsetComponent.trim()
      const [imageStyle, breakpoint] = srcsetComponent.split(' ')
      computedSrcset.push(`${attributes.src}?style=${imageStyle} ${breakpoint}`)
    })

    if (responsiveStyleDefinition.sizes) {
      attributes.sizes = responsiveStyleDefinition.sizes
    }

    attributes.srcset = computedSrcset.join(', ')
  }

  return attributes
}

/**
 * For non-static generation apply image style as query string.
 */
const processSrcImageStyleNonStatic = function (src, imageStyle) {
  if (!validateImageStyle(imageStyle)) {
    return src.split('?')[0]
  }

  return src.split('?')[0] + '?style=' + imageStyle
}

/**
 * Get query object from a path.
 */
const getQueryParams = function (src) {
  const queryString = src.split('?')[1] || ''
  return queryString.split('&').reduce((acc, param) => {
    const [key, value] = param.split('=')
    acc[key] = value
    return acc
  }, {})
}

/**
 * Add a single image to the static generate registry.
 */
const addToGenerateRegistry = function (src, imageStyle = '') {
  const imageLoaderRegistry = process.$imageLoaderRegistry

  if (imageStyle) {
    if (!validateImageStyle(imageStyle)) {
      return
    }
    // Strip query string and append style query string.
    src = src.split('?')[0] + '?style=' + imageStyle
  }

  if (!imageLoaderRegistry.includes(src)) {
    imageLoaderRegistry.push(src)
  }
}

/**
 * Add images to the global registry of images to statically generate when
 * generate:done hook fires.
 */
const addToGenerateRegistryFromProps = function (props) {
  let src = props.src

  if (!src) {
    return
  }

  // Prioritize responsiveStyle prop.
  if (props.responsiveStyle) {
    if (!validateResponsiveStyle(props.responsiveStyle)) {
      return
    }

    const responsiveStyles = <%= JSON.stringify(options.responsiveStyles) %>
    const responsiveStyleDefinition = responsiveStyles[props.responsiveStyle]

    // Add each image style defined in the responsiveStyle to generate registry.
    responsiveStyleDefinition.srcset.split(',').forEach(srcsetComponent => {
      srcsetComponent = srcsetComponent.trim()
      const [imageStyle, _] = srcsetComponent.split(' ')
      addToGenerateRegistry(src, imageStyle)
    })

    // Add original image src to generate registry.
    addToGenerateRegistry(src)
    return
  }

  // Non-responsive imageStyle prop processing.
  if (props.imageStyle) {
    addToGenerateRegistry(src, props.imageStyle)
    return
  }

  // Fallback registering src prop.
  addToGenerateRegistry(src)
}

Vue.component('nuxt-img', {
  functional: true,
  props: {
    'src': {type: String, required: true},
    'image-style': {type: String, required: false},
    'responsive-style': {type: String, required: false}
  },
  render (createElement, context) {
    const props = context.props
    const isStatic = context.parent.$root.$options.context.isStatic

    /**
     * Wrapper for rendered component. Allows deferring creation until
     * processing below is ready.
     */
    const createdElement = () => {
      return createElement('img', {
        attrs: {
          ...props,
          ...context.data.attrs
        },
        staticClass: context.data.staticClass,
        staticStyle: context.data.staticStyle,
        class: context.data.class,
        style: context.data.style
      })
    }

    if (isStatic) {
      if (typeof process.$imageLoaderRegistry !== 'undefined') {
        // nuxt generate is running.
        addToGenerateRegistryFromProps(props)
      }

      // Prioritize responsiveStyle prop for src path processing.
      if (props.responsiveStyle) {
        const processedAttributes = processSrcResponsiveStyleStatic(props.src, props.responsiveStyle, context.parent.$root.$options.context.route.path)

        // Update src and srcset attributes.
        props.src = processedAttributes.src
        context.data.attrs.srcset = processedAttributes.srcset

        // Update sizes attribute if set.
        if (processedAttributes.srcset) {
          context.data.attrs.sizes = processedAttributes.sizes
        }

        delete props.responsiveStyle
        return createdElement()
      }

      // Check imageStyle prop for src path processing.
      if (props.imageStyle) {
        props.src = processSrcImageStyleStatic(props.src, props.imageStyle, context.parent.$root.$options.context.route.path)
        delete props.imageStyle
        return createdElement()
      }

      // Fallback to query string style=[string] for src path processing.
      const queryParams = getQueryParams(props.src)
      if (queryParams.style) {
        props.src = processSrcImageStyleStatic(props.src, queryParams.style, context.parent.$root.$options.context.route.path)
        return createdElement()
      }

      // No style attribute in query string provided or no style prop provided.
      // Process in order to rewrite relative path to static image.
      props.src = processSrcImageStyleStatic(props.src, null, context.parent.$root.$options.context.route.path)
      return createdElement()
    }

    // Non-static site: HMR or node server running.
    if (!isStatic) {

      // If imageStyle or responsiveStyle props are used remove any existing
      // query string and append the style query string for both
      // server-side-rendering support using this module's serverMiddleware and
      // single-page-application calls to the API.

      // Prioritize responsiveStyle prop for src path processing.
      if (props.responsiveStyle) {
        const processedAttributes = processSrcResponsiveStyleNonStatic(props.src, props.responsiveStyle)

        // Update src and srcset attributes.
        props.src = processedAttributes.src
        context.data.attrs.srcset = processedAttributes.srcset

        // Update sizes attribute if set.
        if (processedAttributes.srcset) {
          context.data.attrs.sizes = processedAttributes.sizes
        }

        delete props.responsiveStyle
        return createdElement()
      }

      // Check imageStyle prop for src path processing.
      if (props.imageStyle) {
        props.src = processSrcImageStyleNonStatic(props.src, props.imageStyle)
        delete props.imageStyle
        return createdElement()
      }

      // Check query string style=[string] for src path processing.
      const queryParams = getQueryParams(props.src)
      if (queryParams.style) {
        props.src = processSrcImageStyleNonStatic(props.src, queryParams.style)
        return createdElement()
      }

      // Fallback in case either responsiveStyle, imageStyle or query string are
      // not set.
      return createdElement()
    }
  }
})