import Vec3 = twgl.Vec3;

var _geomCache: { [key: string]: twgl.BufferInfo } = {};

export interface CellType {
  render(env: number[]): twgl.BufferInfo;
}

// Cell types stored in the low 16-bits.
export const CellTypeMask = 0xffff;

// Cell args stored in the high 16-bits.
export const CellArgsMask = 0xffff0000;
export const CellArgsShift = 16;

// High bit of the cell-type: 1 => terrain (Participates in marching-cubes surface rendering).
export const CellTerrainBit = 0x8000;
export const TerrainTypeMask = 0x7fff;

// Chunk cells.
export const CellAir = 0x0000; // Special case: air == 0 (always ignored).
export const CellWall = 0x0001;
export const CellFloor = 0x0002;

// Terrain cells.
export const CellDirt = 0x8001;
export const CellGrass = 0x8002;

var cellTypes: {[type: number]: CellType} = {};
var terrainColor: { [terrainType: number]: Vec3} = {
  0x0000: [0, 0, 0],     // Empty/unknown
  0x0001: [0.5, 0.2, 0], // Dirt
  0x0002: [0, 0.8, 0],   // Grass
};

export function cellType(cell: number): number {
  return cell & CellTypeMask;
}

export function cellArgs(cell: number): number {
  return (cell & CellArgsMask) >>> CellArgsShift;
}

export function registerCell(cell: number, type: CellType) {
  cellTypes[cell] = type;
}

export function typeForCell(cell: number): CellType {
  return cellTypes[cell];
}

export function terrainCellColor(cell: number): Vec3 {
  return terrainColor[cell & TerrainTypeMask];
}

export function makeCell(type: number, args: number = 0): number {
  return (args << CellArgsShift) | type;
}

export function terrainCell(type: number, density: number): number {
  return makeCell(type, density * 0xffff);
}

export function isTerrain(type: number): boolean {
  return (type & CellTerrainBit) != 0;
}

export function envOfs(x: number, y: number, z: number): number {
  return (y * 9) + (z * 3) + x;
}

export function envOfsCenter(dx: number, dy: number, dz: number): number {
  return 13 + (dy * 9) + (dz * 3) + dx;
}

export function geomForEnv(x: number, y: number, z: number, env: number[]): twgl.BufferInfo {
  var key = envKey(env);
  if (!(key in _geomCache)) {
    var bt = typeForCell(cellType(env[envOfsCenter(0, 0, 0)]));
    if (bt) {
      _geomCache[key] = bt.render(env);
    } else {
      delete _geomCache[key];
    }
  }
  return _geomCache[key];
}

function envKey(env: number[]): string {
  return env.toString();
}
