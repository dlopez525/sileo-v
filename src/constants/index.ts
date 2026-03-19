export const SILEO_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export const DEFAULT_DURATION = 6000;
export const DEFAULT_POSITION = "top-right" as const;
export const DEFAULT_ROUNDNESS = 16;
export const EXIT_DURATION = 400;
export const AUTO_EXPAND_DELAY = 600;
export const AUTO_COLLAPSE_DELAY = 3000;
export const HEIGHT = 40;
export const WIDTH = 350;
export const BLUR_RATIO = 0.4;
export const MIN_EXPAND_RATIO = 1.5;
export const PILL_PADDING = 8;
export const HEADER_EXIT_MS = 400;
export const SWAP_COLLAPSE_MS = 300;
export const SPRING = { stiffness: 300, damping: 25, bounce: 0.25 } as const

export const THEME_FILLS = {
  light: '#1a1a1a',
  dark: '#f2f2f2',
} as const;