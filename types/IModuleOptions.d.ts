import { OutgoingHttpHeaders } from 'http';

export interface IImageStyles {
  macros?: Array<string>,
  actions?: Array<string>
}

export interface IForceGenerateImages {
  [key: string] : String
}

export interface IModuleOptions {
  imagesBaseDir: string,
  imageStyles?: IImageStyles,
  forceGenerateImages?: IForceGenerateImages,
  imageHeaders?: OutgoingHttpHeaders
}
