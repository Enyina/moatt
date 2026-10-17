import { GarmentPart, UVRegion } from './garmentTypes';

export const TSHIRT_UV_REGIONS: Partial<Record<GarmentPart, UVRegion>> = {
  front: { x: 0, y: 0, w: 0.5, h: 0.5 },
  back: { x: 0.5, y: 0, w: 0.5, h: 0.5 },
  leftSleeve: { x: 0, y: 0.5, w: 0.5, h: 0.5 },
  rightSleeve: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  leftSide: { x: 0.45, y: 0, w: 0.05, h: 0.5 },
  rightSide: { x: 0.95, y: 0, w: 0.05, h: 0.5 },
};

export const HOODIE_UV_REGIONS: Partial<Record<GarmentPart, UVRegion>> = {
  front: { x: 0, y: 0, w: 1/3, h: 0.5 },
  back: { x: 1/3, y: 0, w: 1/3, h: 0.5 },
  hood: { x: 2/3, y: 0, w: 1/3, h: 0.5 },
  leftSleeve: { x: 0, y: 0.5, w: 1/3, h: 0.5 },
  rightSleeve: { x: 1/3, y: 0.5, w: 1/3, h: 0.5 },
  leftSide: { x: 0.3, y: 0, w: 0.04, h: 0.5 },
  rightSide: { x: 0.63, y: 0, w: 0.04, h: 0.5 },
  pocket: { x: 2/3, y: 0.5, w: 1/3, h: 0.5 },
};
