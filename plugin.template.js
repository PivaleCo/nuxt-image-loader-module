const Vue = require('vue')

Vue.component('nuxt-img', {
  functional: true,
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {type: String},
    srcset: {type: String},
    id: {type: String},
    class: {type: String},
    style: {type: String},
  },
  render (createElement, context) {
    const props = context.props

    if (context.parent.$root.$options.context.isStatic) {
      // Add images to the global registry of images to statically generate.
      const imageLoaderRegistry = process.$imageLoaderRegistry
      if (!imageLoaderRegistry.includes(props.src)) {
        imageLoaderRegistry.push(props.src)
      }

      //const basePath = context.parent.$root.$options.context.base
      const routerPath = context.parent.$root.$options.context.route.path
      const routerPathDepth = routerPath === '/' ? 0 : routerPath.substring(1).split('/').length
      const relativeBasePath = routerPathDepth === 0 ? '' : Array(routerPathDepth).fill('..').join('/') + '/'

      const queryString = props.src.split('?')[1]
      if (queryString) {
        const params = queryString.split('&').reduce((acc, param) => {
          const [key, value] = param.split('=')
          acc[key] = value
          return acc
        }, {})
        if (params.style) {
          const splitPath = props.src.split('.')
          const filenameIndex = splitPath.length - 2
          splitPath[filenameIndex] = splitPath[filenameIndex] + '--' + params.style
          props.src = splitPath.join('.')
        }
      }
      const srcStrippedQuery = props.src.split('?')[0]

      props.src = relativeBasePath + 'image-styles' + srcStrippedQuery

      return createElement('img', {
        attrs: {
          ...props
        }
      })
    }

  }
})