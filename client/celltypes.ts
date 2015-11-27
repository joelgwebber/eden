module Eden {

  // Cell types stored in the low 16-bits.
  export const CellTypeMask = 0xffff;
  export const CellGround = 0; // Participates in marching-cubes surface rendering.
  export const CellWall = 1;
  export const CellFloor = 2;

  // Cell args stored in the high 16-bits.
  export const CellArgsMask = 0xffff0000;
  export const CellArgsShift = 16;

  export var cellTypes: {[id: number]: CellType} = {};

  export function cellType(cell: number): number {
    return cell & CellTypeMask;
  }

  export function cellArgs(cell: number): number {
    return (cell & CellArgsMask) >>> CellArgsShift;
  }

  export function registerCell(type: number, cell: CellType) {
    cellTypes[type] = cell;
  }
}
