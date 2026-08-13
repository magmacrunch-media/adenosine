export interface MusicConfig {
  url: string;
  volume?: number;
  fadeIn?: number;
}

export interface SfxConfig {
  url: string;
  volume?: number;
  pool?: number;
}

export interface AudioManifest {
  music?: MusicConfig;
  sfx?: Record<string, SfxConfig>;
  autoVisibility?: boolean;
}

export interface VisibilityOptions {
  pauseMusic?: boolean;
  muteSfxOnHidden?: boolean;
}
