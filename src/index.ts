import { IModuleOptions, IImageStyles } from '../types/IModuleOptions';
import { IFileTypeMetadata } from '../types/IFileTypeMetadata';

import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import * as mkdirp from 'mkdirp'
import * as gm from 'gm'
import { ServerResponse, IncomingMessage, OutgoingHttpHeaders } from 'http'
import * as Url from 'url'

import macros from './macros'

const stripTrailingLeadingSlashes = function (input: string) : string {
  input = input[input.length-1] === '/' ? input.substring(0, input.length-1) : input
  return input[0] === '/' ? input.substring(1) : input
}

const pipelineApplyActions = function ({ pipeline, style, styleName, errors }) : void {
  if (!style.actions || !Array.isArray(style.actions)) {
    return
  }

  style.actions.forEach((actionArguments, index) => {
    const actionIndex = index + 1
    if (!actionArguments) {
      errors.push(new Error(`Image style: ${styleName} - action ${actionIndex} must not be empty`))
      return
    }
    actionArguments = actionArguments.split('|')
    if (actionArguments.length < 1) {
      errors.push(new Error(`Image style: ${styleName} - action ${actionIndex} must provide at least one argument`))
      return
    }
    const action = actionArguments.shift()
    if (typeof pipeline[action] === 'undefined') {
      errors.push(new Error(`Image style: ${styleName} - ${action} is not a valid action`))
      return
    }
    try {
      pipeline[action].apply(pipeline, actionArguments)
    }
    catch (error) {
      errors.push(error)
    }
  })
}

const pipelineApplyMacros = function ({ style, styleName, errors }) : void {
  if (!style.macros || !Array.isArray(style.macros)) {
    return
  }
  style.macros.forEach((macroArguments, index) => {
    const macroIndex = index + 1
    if (!macroArguments) {
      errors.push(new Error(`Image style: ${styleName} - macro ${macroIndex} must not be empty`))
      return
    }
    macroArguments = macroArguments.split('|')
    if (macroArguments.length < 1) {
      errors.push(new Error(`Image style: ${styleName} - macro ${macroIndex} must provide at least one argument`))
      return
    }
    const macro = macroArguments.shift()

    if (typeof macros[macro] === 'undefined') {
      errors.push(new Error(`Image style: ${styleName} - ${macro} is not a valid macro`))
      return
    }

    style.actions = macros[macro].apply(null, macroArguments).concat(style.actions || [])

    // Prevent macros from reapplying on later processing calls.
    delete style.macros[index]
  })
}

const respondWithError = (res: ServerResponse, error: Error): void => {
  console.error(error)
  res.writeHead(500)
  res.end(error.message)
}

const respondWithFile = (res: ServerResponse, imagePath: string, mimeType: string, additionalHeaders: OutgoingHttpHeaders): void => {
  const fileContent = fs.readFileSync(imagePath)
  const headers: OutgoingHttpHeaders = {
    'Content-Type': mimeType,
    // 1 day (60 seconds * 60 minutes * 24 hours)
    'Cache-Control': 'max-age=86400'
  }

  // Allow user header overrides.
  Object.keys(additionalHeaders).forEach(header => {
    headers[header] = additionalHeaders[header]
  })

  res.writeHead(200, headers);
  res.end(fileContent)
}

const fileTypeMetadata = function() : IFileTypeMetadata {
  // See: https://github.com/broofa/node-mime/blob/master/types/standard.json
  return {
    '.png': { mime: 'image/png' },
    '.jpg': { mime: 'image/jpeg' },
    '.jpe': { mime: 'image/jpeg' },
    '.jpeg': { mime: 'image/jpeg' },
    '.gif': { mime: 'image/gif' },
  }
}

const imageLoaderFactory = (options: IModuleOptions) => function (req: IncomingMessage, res, next) {
  const queryString = Url.parse(req.url).query
  const url = req.url.replace(Url.parse(req.url).search, '')
  const requestExtension = path.extname(url)

  const imageHeaders = options.imageHeaders || {}

  const metadata = fileTypeMetadata()

  if (!Object.keys(metadata).includes(requestExtension)) {
    return next()
  }

  const mimeType = metadata[requestExtension].mime

  // options.imagesBaseDir allows overriding default 'content' directory.
  const imagesBaseDir = options.imagesBaseDir ? stripTrailingLeadingSlashes(options.imagesBaseDir) : 'content'

  // Lookup image file in the base images directory.
  const filePath = `./${imagesBaseDir}${url}`
  const fileExists = fs.existsSync(filePath)

  if (fileExists) {
    const initialQueryParams = {
      style: ''
    }
    const query: { style: string } = !queryString ? initialQueryParams : queryString.split('&').reduce((acc, query) => {
      const [key, value] = query.split('=')
      acc[key] = value
      return acc
    }, initialQueryParams)

    const imageStyles = options.imageStyles || {}

    if (query.style && !Object.keys(imageStyles).includes(query.style)) {
      console.error(`${query.style} is not a valid image style for ${req.url}`)
    }

    if (query.style && Object.keys(imageStyles).includes(query.style)) {

      const subDir = path.dirname(url)
      const styleDir = path.join('static', 'image-styles', subDir)

      const sourceBasename = path.basename(url, requestExtension)
      const targetFile = `${sourceBasename}--${query.style}${requestExtension}`
      const targetPath = path.join(styleDir, targetFile)

      if (fs.existsSync(targetPath)) {
        // Respond with existing (already processed) file.
        return respondWithFile(res, targetPath, mimeType, imageHeaders)
      }

      const styleName = query.style
      const style: IImageStyles = imageStyles[styleName]

      // Prepare target directory.
      if (!fs.existsSync(styleDir)) {
        mkdirp.sync(styleDir)
      }

      const pipeline = gm(filePath)

      const errors: Array<Error> = []
      pipelineApplyMacros({ style, styleName, errors })
      pipelineApplyActions({ pipeline, style, styleName, errors })

      if (errors.length > 0) {
        // Only respond with the first error encountered but log all.
        errors.forEach(error => console.error(error))
        return respondWithError(res, errors[0])
      }

      // Respond with new processed file.
      return pipeline.write(targetPath, function (error) {
        if (!error) {
          return respondWithFile(res, targetPath, mimeType, imageHeaders)
        }
        return respondWithError(res, error)
      });
    }

    // Respond with source file.
    return respondWithFile(res, filePath, mimeType, imageHeaders)
  }

  // Fall through to nuxt's own 404 page.
  next()
}

/**
 * Get query object from a path.
 */
const getQueryParams = function (src) : { [key: string] : string } {
  const queryString = src.split('?')[1] || ''
  return queryString.split('&').reduce((acc, param) => {
    const [key, value] = param.split('=')
    acc[key] = value
    return acc
  }, {})
}

/**
 * Process all images called from nuxt-img render registry, so that nuxt
 * generate can include static image files.
 *
 * Images without styles are copied without graphicsmagick alterations.
 */
async function generateStaticImages ({ imagePaths, imageStyles, imagesBaseDir, generateDir } : { imagePaths: Array<string>, imageStyles: {}, imagesBaseDir: string, generateDir: string}) {
  // options.imagesBaseDir allows overriding default 'content' directory.
  imagesBaseDir = imagesBaseDir ? stripTrailingLeadingSlashes(imagesBaseDir) : 'content'

  for (const imagePath of imagePaths) {
    const query = getQueryParams(imagePath)

    if (query.style && !Object.keys(imageStyles).includes(query.style)) {
      // Image style not defined.
      console.error(`Image style not defined on ${imagePath}`)
      continue
    }

    const derivativeSuffix = query.style ? `--${query.style}` : ''
    const isDerivative = !!derivativeSuffix
    const imagePathNoQuery = imagePath.split('?')[0]
    // Lookup image file in the base images directory.
    const filePath = `./${imagesBaseDir}${imagePathNoQuery}`
    const requestExtension = path.extname(imagePathNoQuery)

    const subDir = path.dirname(imagePathNoQuery)
    const styleDir = path.join(generateDir, 'image-styles', subDir)

    const sourceBasename = path.basename(imagePathNoQuery, requestExtension)
    const targetFile = `${sourceBasename}${derivativeSuffix}${requestExtension}`
    const targetPath = path.join(styleDir, targetFile)

    const styleName = query.style
    const style = imageStyles[styleName]

    // Prepare target directory.
    if (!fs.existsSync(styleDir)) {
      mkdirp.sync(styleDir)
    }

    if (!isDerivative) {
      // Copy only
      fs.copyFileSync(filePath, targetPath)
      continue
    }

    const pipeline = gm(path.resolve(filePath))

    const errors = []
    pipelineApplyMacros({ style, styleName, errors })
    pipelineApplyActions({ pipeline, style, styleName, errors })

    if (errors.length > 0) {
      errors.forEach(error => console.error(error))
      continue
    }

    // Write processed file.
    await pipeline.write(targetPath, function (error) {
      if (error) {
        console.error(error)
      }
    })
    // A forced await is required due to some (yet) unexplained reason where gm
    // may not generate files in some instances. This may become a problem for a
    // large number of files to process, although as this is only run at build
    // time, it's currently a sufficient workaround.
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}

/**
 * Find and register any images that should be forced rendered.
 *
 * For images that are lazy loaded it's not possible to know ahead of time
 * during `nuxt generate` which images should be processed statically.
 */
const addForceGeneratedImages = async function (moduleOptions: IModuleOptions) {
  const forceGenerateConfig = moduleOptions.forceGenerateImages
  const baseDir = moduleOptions.imagesBaseDir

  if (typeof forceGenerateConfig === 'object') {

    Object.keys(forceGenerateConfig).forEach(style => {
      if (!moduleOptions.imageStyles[style]) {
        // forceGenerateImages key doesn't match an imageStyles key.
        console.error(`forceGenerateImages key ${style} doesn't match an imageStyles key`)
        return
      }

      const globPattern = forceGenerateConfig[style]

      const imageFileTypes = Object.keys(fileTypeMetadata())

      // List all images matching the specified glob pattern inside the base
      // directory. Filter any non-image types after glob pattern is applied.
      const images = glob.sync(`./${baseDir}/${globPattern}`, {
        nodir: true
      }).filter(f => imageFileTypes.includes(path.extname(f).toLowerCase()))

      if (images.length === 0) {
        console.error(`No images were found in ${baseDir} using the glob pattern ${globPattern}`)
        return
      }

      // Transform all image paths to be compatible with query format expected
      // by generateStaticImages()
      images
        .map(x => x.replace(`./${baseDir}`, '')) // Remove base directory
        .map(x => x + `?style=${style}`) // Append style query
        .forEach(x => process.$imageLoaderRegistry.push(x)) // Add to global registry
    })
  }
}

/**
 * Nuxt Image Loader Module entry point.
 */
module.exports = function imageLoader (moduleOptions: IModuleOptions) {
  const imageLoaderHandler = imageLoaderFactory(moduleOptions)

  const validImageStyles = moduleOptions.imageStyles && typeof moduleOptions.imageStyles === 'object' ? Object.keys(moduleOptions.imageStyles) : []

  const buildType = process.env.npm_lifecycle_event

  this.addServerMiddleware({ path: '', handler: imageLoaderHandler })
  this.addPlugin({
    src: path.resolve(__dirname, '../src', 'plugin.template.js'),
    options: {
      validImageStyles
    }
  })

  if (buildType === 'generate') {
    const generateDir = this.nuxt.options.generate.dir
    process.$imageLoaderRegistry = []
    this.nuxt.hook('generate:done', async function(nuxt, errors) {

      if (errors.toString()) {
        console.error(errors.toString())
      }

      await addForceGeneratedImages(moduleOptions)

      // Filter out duplicate values in the imageLoaderRegistry.
      process.$imageLoaderRegistry = [...new Set(process.$imageLoaderRegistry)]

      await generateStaticImages({
        imagePaths: process.$imageLoaderRegistry,
        imageStyles: moduleOptions.imageStyles,
        imagesBaseDir: moduleOptions.imagesBaseDir,
        generateDir
      })
    })
  }
}
