
interface IImageStyles {
  macros?: Array<string>,
  actions?: Array<string>
}

interface IForceGenerateImages {
  [key: string] : String
}

interface IModuleOptions {
  imagesBaseDir: string,
  imageStyles?: IImageStyles,
  forceGenerateImages?: IForceGenerateImages
}
