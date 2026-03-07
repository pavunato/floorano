import { FurnitureType, Size } from './types';

export const DEFAULT_DOOR_SIZE: Size = { width: 900, height: 200 };

export const DEFAULT_FURNITURE_SIZES: Record<FurnitureType, Size> = {
  stove:    { width: 800,  height: 600 },
  sink:     { width: 600,  height: 440 },
  fridge:   { width: 600,  height: 700 },
  toilet:   { width: 500,  height: 700 },
  shower:   { width: 900,  height: 900 },
  washer:   { width: 600,  height: 600 },
  dryer:    { width: 600,  height: 600 },
  sofa:     { width: 3600, height: 1200 },
  tv:       { width: 1200, height: 200 },
  bed:      { width: 1600, height: 2000 },
  table:    { width: 1600, height: 800 },
  chair:    { width: 450,  height: 450 },
  desk:     { width: 1200, height: 600 },
  wardrobe: { width: 1800, height: 600 },
  plant:    { width: 400,  height: 400 },
  bathtub:  { width: 1700, height: 800 },
};
