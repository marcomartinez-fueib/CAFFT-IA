// Video configuration from environment variables
// These values can be overridden in .env.local or .env files

export const VIDEOS_BASE_URL = 
  import.meta.env.VIDEOS_BASE_URL || 
  'https://github.com/marcomartinez-fueib/CAFFT-IA/releases/download/v1.0.0-videos/';

export const GITHUB_RELEASE_TAG = 
  import.meta.env.GITHUB_RELEASE_TAG || 
  'v1.0.0-videos';

// Helper function to build full video URL
export const getVideoUrl = (videoId: string, language: string): string => {
  return `${VIDEOS_BASE_URL}${videoId}_${language}.mp4`;
};

// Helper function for exposure explanation video
export const getExposureExplanationVideoUrl = (language: string): string => {
  return `${VIDEOS_BASE_URL}exposure_explanation_${language}.mp4`;
};
