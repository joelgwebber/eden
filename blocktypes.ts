module Eden {

  // TODO: Under
  export const EnvSouthWest = 9;
  export const EnvSouth = 10;
  export const EnvSouthEast = 11;
  export const EnvWest = 12;
  export const EnvCenter = 13;
  export const EnvEast = 14;
  export const EnvNorthWest = 15;
  export const EnvNorth = 16;
  export const EnvNorthEast = 17;
  // TODO: Over

  export const BlockAir = 0;
  export const BlockWall = 1;
  export const BlockFloor = 2;

  export var blockTypes: {[id: number]: BlockType} = {};

  export function registerBlock(type: number, block: BlockType) {
    blockTypes[type] = block;
  }
}
