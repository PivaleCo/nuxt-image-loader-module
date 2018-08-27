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

const validateImageStyle = function (style) {
  const validImageStyles = [<%= options.validImageStyles.map(x => "'" + x + "'") %>]

  if (!validImageStyles.includes(style)) {
    console.error('Invalid image style: ' + style)
    return false
  }
  return true
}

/**
 * Process a src attribute for static generation.
 */
const processSrcStatic = function (src, style, routerPath) {
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
 * For non-static generation apply image style as query string.
 */
const processSrcNonStatic = function (src, style) {
  if (!validateImageStyle(style)) {
    return src.split('?')[0]
  }

  return src.split('?')[0] + '?style=' + style
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
 * Add images to the global registry of images to statically generate when
 * generate:done hook fires.
 */
const addToGenerateRegistry = function (props) {
  let src = props.src
  const imageLoaderRegistry = process.$imageLoaderRegistry

  if (props.imageStyle) {
    if (!validateImageStyle(props.imageStyle)) {
      return
    }
    // Strip query string and append style.
    src = src.split('?')[0] + '?style=' + props.imageStyle
  }

  if (!imageLoaderRegistry.includes(src)) {
    imageLoaderRegistry.push(src)
  }
}

Vue.component('nuxt-img', {
  functional: true,
  props: {
    src: {
      type: String,
      required: true,
    },
    'image-style': {type: String},
    alt: {type: String},
    srcset: {type: String},
    id: {type: String},
    class: {type: String},
    style: {type: String},
  },
  render (createElement, context) {
    const props = context.props
    const isStatic = context.parent.$root.$options.context.isStatic

    /**
     * Wrapper for rendered component.
     */
    const createdElement = () => {
      return createElement('img', {
        attrs: {
          ...props
        }
      })
    }

    if (isStatic) {
      if (!process.browser) {
        // nuxt generate is running.
        addToGenerateRegistry(props)
      }

      // Prioritize style prop for src path processing.
      if (props.imageStyle) {
        props.src = processSrcStatic(props.src, props.imageStyle, context.parent.$root.$options.context.route.path)
        delete props.imageStyle
        return createdElement()
      }

      // Fallback to query string style=[string] for src path processing.
      const queryParams = getQueryParams(props.src)
      if (queryParams.style) {
        props.src = processSrcStatic(props.src, queryParams.style, context.parent.$root.$options.context.route.path)
        return createdElement()
      }

      // No style attribute in query string provided or no style prop provided.
      // Process in order to rewrite relative path to static image.
      props.src = processSrcStatic(props.src, null, context.parent.$root.$options.context.route.path)
      return createdElement()
    }

    // Non-static site: HMR or node server running.

    // If style prop is used remove any existing query string and append the
    // style query string for both server-side-rendering support using this
    // module's serverMiddleware and single-page-application calls to the API.
    if (props.imageStyle) {
      props.src = processSrcNonStatic(props.src, props.imageStyle)
      delete props.imageStyle
    }

    return createdElement()
  }
})