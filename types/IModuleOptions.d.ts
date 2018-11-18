import { OutgoingHttpHeaders } from 'http';

export interface IImageStyles {
  macros?: Array<string>,
  actions?: Array<string>
}

export interface IResponsiveStyles {
  [responsiveStyle: string]: {
    srcset: string,
    sizes?: string
  }
}

export interface IForceGenerateImages {
  [key: string] : string
}

export interface IModuleOptions {
  imagesBaseDir: string,
  imageStyles?: IImageStyles,
  responsiveStyles? : IResponsiveStyles,
  forceGenerateImages?: IForceGenerateImages,
  imageHeaders?: OutgoingHttpHeaders
}
