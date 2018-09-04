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
    ['../../index.js', {
      imagesBaseDir: 'content',
      imageStyles: {
        small: { macros: ['scaleAndCrop|160|90'] },
        medium: { macros: ['scaleAndCrop|320|180'] },
        large: { macros: ['scaleAndCrop|640|360'] },
      },
      forceGenerateImages: {
        medium: '**/*'
      }
    }]
  ]
}
