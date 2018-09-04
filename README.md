
![Nuxt Image Loader logo and example](https://github.com/reallifedigital/nuxt-image-loader-module/raw/master/docs/intro-graphic.jpg)

[![CircleCI](https://circleci.com/gh/reallifedigital/nuxt-image-loader-module/tree/master.svg?style=svg)](https://circleci.com/gh/reallifedigital/nuxt-image-loader-module/tree/master)

# Nuxt Image Loader Module

This module will automatically resize, rotate, blur, watermark and crop (etc...) your images based on rules you define.

This module works by intercepting incoming image requests (on the server side) and will respond with either the source image or a _processed_ image if a query string is appended to the image URL.

Processing of images is done by defining 'image styles' in `nuxt.config.json`. You can add as many of these as suits your needs.

Images are processed using the [GraphicsMagick for node](https://github.com/aheckmann/gm) package, so please refer the documentation there to understand the variety of image processing capabilities and options.

Works for all of nuxt deployment modes:

* Server Rendered - `npm run build && npm run start`
* Statically Generated - `npm run generate`
* Hot Module Replacement - `npm run dev`

## Installation

1. __IMPORTANT:__ Install the [graphicsmagick package](http://www.graphicsmagick.org/README.html) on the same host system (or container) where your application lives.

2. Install this module as a dependency in your project:

```shell
npm install @reallifedigital/nuxt-image-loader-module
```

## Setup

Your nuxt.config.js file should contain something like the following:

```javascript
module.exports = {

  // ...

  modules: [
    ['@reallifedigital/nuxt-image-loader-module', {
      imagesBaseDir: 'content',
      imageStyles: {
        thumbnail: { actions: ['gravity|Center', 'resize|320|180^', 'extent|320|180|+0|+90'] },
        small: { macros: ['scaleAndCrop|160|90'] },
        medium: { macros: ['scaleAndCrop|320|180'] },
        large: { macros: ['scaleAndCrop|640|360'] },
      },
    }]
  ],

  // ...

}
```

### Explanation of module options:

* `imagesBaseDir` - This module will search a sub-directory in your nuxt application for images. By default, this is set to a sub-directory named 'content', but you can change this to the needs of your application
* `imageStyles` - This is an object containing the image processing settings where the key is the name of the image style you want to use in the image URL (see below). The value of each image style definition should contain at least one of the following key/values:
  * `actions` - An array of image actions to perform. For example, referring to the [Graphicsmagick documentation](http://aheckmann.github.io/gm/docs.html) you'll find several actions which can be performed. You notice for the example `nuxt.config.js` example above that each action is defined with the processing method name first followed by a (`|`) pipe separator. If the processing method has arguments (such as height and width) then these are appended to the action delimited by further pipe separators.
  * `macros` - This module currently only has one macro defined called `scaleAndCrop`. This does some heavy lifting to chain multiple actions together into an easy-to-read requirement. We'll add to this list of macros as we find further uses for common sets of actions. If you'd like to suggest others, please [open an issue](https://github.com/reallifedigital/nuxt-image-loader-module/issues), or, even better, submit a pull request.
  * (Please note that you _can_ use macros and actions together, just bear in mind that actions are performed _after_ macros.)
* `forceGenerateImages` - This is an object to force process image style derivatives in generate mode. See details further down in this readme.

## Calling a processed image with query strings

> Important: This method will only work with server rendering. For statically generated sites see the `nuxt-img` component method below.

1. Let's assume that you have your images located in a sub-directory of your project named `content`. Place an image in that directory called, for example, `test.png`. Make it a fairly large image if you're following along. Also, ensure you've followed the above installation steps and have mirrored the same `nuxt.config.js` configuration above with at least the 'small' image style definition.

2. In one of your nuxt pages (or layout, component etc.) create an img tag that references the image:
```html
<img src="/test.png" alt="Never forget alt tags!" />
```
With your nuxt application running, you should now see your image loaded by this module, but nothing too surprising is happening just yet, except to say that the image has been loaded from the `content` directory.

3. Now change the image URL to:
```html
<img src="/test.png?style=small" alt="Never forget alt tags!" />
```
On refresh (or hot reload) you will see that the image has been automatically resized to 160px x 90px. If you see a smaller image than in step 2, then you've configured this module correctly. You'll also notice that a cached version of the processed image now lives in `<YOUR-APP-ROOT>/static/image-styles/test--small.png`. This image will be loaded on subsequent requests to `/test.png?style=small` for optimized performance.

## Calling a processed image with the `<nuxt-img />` component

> Using the `<nuxt-img />` component is the preferred method to load processed and original images due its clearer syntax and ability to automatically parse and generate relative URL paths which are required for `nuxt generate` to work correctly.

When you have this module included and loaded via your nuxt.config.js file (instructions above) you will have access to a global `<nuxt-img />` component. This works very similarly to a regular `<img>` tag, except that you can supply an optional `image-style` attribute which should match once of your pre-defined image styles.

```html
<nuxt-img src="/test.png" image-style="small" alt="Never forget alt tags!" />
```

> Bear in mind that the root src path you supply becomes relative to your `imagesBaseDir` which defaults to a directory named 'content' in the root of your application.

You can bind the `src` and `image-style` with dynamic data properties from your nuxt page, layout or component. For example in a Vue single file component:

```vue
<template>
  <div>
    <nuxt-img :src="testImage" :image-style="currentStyle" alt="Never forget alt tags!" />
  </div>
</template>

<script>
export default {
  data () {
    return {
      testImage: '/test.png',
      currentStyle: 'small'
    }
  }
}
</script>
```

## Do you need to lazy load images when running nuxt generate?

* Are you wrapping the `<nuxt-img>` component in a loop that loads asynchronously?
* Are you loading images paths from a vuex store?

If you need to bind a value to the `src` prop of the `<nuxt-img>` component that is _not_ available immediately when the page is rendered, **and** you want to run nuxt in generate mode, then you'll need to configure the `forceGenerateImages` option in your `nuxt.config.js` file so that images can be eagerly loaded at generation time.

```javascript
module.exports = {

  // ...

  modules: [
    ['@reallifedigital/nuxt-image-loader-module', {
      imagesBaseDir: 'content',
      imageStyles: {
        medium: { macros: ['scaleAndCrop|320|180'] },
      },
      forceGenerateImages: {
        // imageStyle: globPattern
        medium: '**/*'
      }
    }]
  ],

  // ...

}
```

The `forceGenerateImages` configuration setting is an object where the key should the image style you want to force generate and the value is a glob pattern from inside your `imagesBaseDir`.

The example glob pattern above (`**/*`) is a catch-all and will find all images in your `imagesBaseDir`.

If you have many images, you may not want to force generate an image style derivative for every one. You may want to refine the catch all pattern from `**/*` to something which better targets where you are lazy-loading images. For example a sub directory with jpegs only: `gallery-images/**/*.{jpg,jpeg}`

Please refer to the full list of [glob syntax options](https://github.com/isaacs/node-glob#glob-primer).

> The `forceGenerateImages` option is _not_ required for when running nuxt in **server** mode because lazy-loaded images send a request to the server which is intercepted by this module's serverMiddleware for on-the-fly image generation or loading an already processed image from disk.

### Further advice and points of note:

1. Your source images should be the largest and unaltered versions you have available - or at least the maximum size you expect to use in your application.

2. You can organize your images files in further sub-directories if you wish. This will also be reflected in the image URL. For example, if you place a file in `<YOUR-APP-ROOT>/content/articles/news/test.png` then then `<img>` tag `src` attribute should be `/content/articles/news/test.png?style=small` or whatever style you want to apply.

3. You may wish to put the following into your `.gitignore` file so that the processed images are not committed into your version controlled files:

```gitignore
# Image styles
static/image-styles
```

4. If you make changes to your image style settings in `nuxt.config.js` the cached processed images will still exist and so you won't immediately see any change. To fix this, simply remove the cached images in the `/static/image-styles` directory or simply remove this directory altogether.

### Contribution

I'd love to hear how you're using this nuxt module and whether anything is missing that would benefit from enhancements. If so, please [open an issue](https://github.com/reallifedigital/nuxt-image-loader-module/issues) on Github.

### Credits

Development is sponsored by [Real Life Digital](https://www.reallifedigital.com)

<img src="https://www.reallifedigital.com/themes/custom/reallifetheme/logo.svg" alt="Real Life Digital Logo" width="50px" height="50px">

Do contact us if you require Vue or Nuxt development. We also build solutions with Drupal.

#### Mentions

* Thanks to @dev7ch for feedback and real world testing of this module.