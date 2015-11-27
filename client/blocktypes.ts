module Eden {

  // Block types stored in the low 16-bits.
  export const BlockTypeMask = 0xffff;
  export const BlockGround = 0; // Participates in marching-cubes surface rendering.
  export const BlockWall = 1;
  export const BlockFloor = 2;

  // Block args stored in the high 16-bits.
  export const BlockArgsMask = 0xffff0000;
  export const BlockArgsShift = 16;

  export var blockTypes: {[id: number]: BlockType} = {};

  export function blockType(block: number): number {
    return block & BlockTypeMask;
  }

  export function blockArgs(block: number): number {
    return (block & BlockArgsMask) >>> BlockArgsShift;
  }

  export function registerBlock(type: number, block: BlockType) {
    blockTypes[type] = block;
  }
}
