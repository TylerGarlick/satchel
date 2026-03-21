// Declaration file for @skeletonlabs/skeleton
declare module '@skeletonlabs/skeleton/dist/types' {
  export interface SkeletonConfiguration {
    theme?: string;
    presets?: {
      theme?: string;
    };
  }
  export const skeletonConfig: SkeletonConfiguration;
}
