import type { BodyProfile } from '../bodyProfile';

export type GarmentPart =
  | 'front'
  | 'back'
  | 'leftSleeve'
  | 'rightSleeve'
  | 'leftSide'
  | 'rightSide'
  | 'hood'
  | 'pocket'
  | 'drawstringLeft'
  | 'drawstringRight';

export interface UVRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type TShirtParams = {
  torsoWidth: number;
  torsoLength: number;
  looseness: number;
  sleeveLength: number;
  sleeveTopRadius: number;
  sleeveCuffRadius: number;
  neckWidth: number;
  neckDropFront: number;
  neckDropBack: number;
  thickness: number;
};

export type HoodieParams = {
  torsoWidth: number;
  torsoLength: number;
  looseness: number;
  sleeveLength: number;
  sleeveTopRadius: number;
  sleeveCuffRadius: number;
  hoodDepth: number;
  hoodHeight: number;
  pocketWidth: number;
  pocketHeight: number;
  thickness: number;
};

export type GarmentInstance =
  | {
      id: string;
      type: "tshirt";
      params: TShirtParams;
    }
  | {
      id: string;
      type: "hoodie";
      params: HoodieParams;
    };

export interface ProceduralGarmentOptions {
  bodyProfile?: BodyProfile;
}
