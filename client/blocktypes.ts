module Eden {

  export const BlockAir = 0;
  export const BlockWall = 1;
  export const BlockFloor = 2;

  export var blockTypes: {[id: number]: BlockType} = {};

  export function registerBlock(type: number, block: BlockType) {
    blockTypes[type] = block;
  }
}
