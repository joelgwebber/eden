module Eden {

  // TODO: Under
  export const EnvNorthWest = 9;
  export const EnvNorth = 10;
  export const EnvNorthEast = 11;
  export const EnvWest = 12;
  export const EnvCenter = 13;
  export const EnvEast = 14;
  export const EnvSouthWest = 15;
  export const EnvSouth = 16;
  export const EnvSouthEast = 17;
  // TODO: Over

  export const BlockAir = 0;
  export const BlockWall = 1;
  export const BlockFloor = 2;

  export var blockTypes: {[id: number]: BlockType} = {};

  export function registerBlock(type: number, block: BlockType) {
    blockTypes[type] = block;
  }
}
