const path = require('path')

module.exports = {
  /*
  ** Build configuration
  */
  build: {},
  /*
  ** Headers
  */
  head: {},
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Modules
  */
  modules: [
    [path.resolve('../../index.js'), {
      imagesBaseDir: 'content',
      imageStyles: {
        small: { macros: ['scaleAndCrop|160|90'] },
        medium: { macros: ['scaleAndCrop|320|180'] },
        large: { macros: ['scaleAndCrop|640|360'] },
      },
      responsiveStyles: {
        thumb: {
          srcset: 'small 160w, medium 320w, large 640w',
          sizes: '(min-width: 1280px) 100vw, 50vw',
        },
      },
      forceGenerateImages: {
        medium: '**/*'
      },
      imageHeaders: {
        'Cache-Control': 'max-age=7200'
      }
    }]
  ]
}
