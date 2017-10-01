import Vec3 = twgl.Vec3;

var _geomCache: { [key: string]: twgl.BufferInfo } = {};

// terrain:
// TODO: Some way to merge fills of ground/liquid?
//  ground type: 16 bits // 64k slots for ground types should be more than enough.
//  ground fill:  5 bits // 32 levels should be enough resolution for fill
//  liquid type:  6 bits // Don't need much more than water, ice, lava, cloud, etc.
//  liquid fill:  5 bits // ...

// Ground types stored in the low 16-bits.
export const GroundTypeShift = 0;
export const GroundTypeMask = 0xffff;

export const GroundFillShift = 16;
export const GroundFillMask = 0x1f;

export const LiquidTypeShift = 21;
export const LiquidTypeMask = 0x3f;

export const LiquidFillShift = 27;
export const LiquidFillMask = 0x1f;

// Ground types.
export const GroundDirt = 0x0001;
export const GroundGrass = 0x0002;
// ...

// Liquid types.
export const LiquidWater = 0x01;
export const LiquidIce = 0x02;
export const LiquidLava = 0x03;
export const LiquidCloud = 0x04;
// ...

var groundColors: { [groundType: number]: Vec3} = {
  0x0000: [0, 0, 0],     // Empty/unknown
  0x0001: [0.5, 0.2, 0], // Dirt
  0x0002: [0, 0.8, 0],   // Grass
};

export function groundType(cell: number): number {
  return (cell >>> GroundTypeShift) & GroundTypeMask;
}

export function groundFill(cell: number): number {
  return (cell >>> GroundFillShift) & GroundFillMask;
}

export function liquidType(cell: number): number {
  return (cell >>> LiquidTypeShift) & LiquidTypeMask;
}

export function liquidFill(cell: number): number {
  return (cell >>> LiquidFillShift) & LiquidFillMask;
}

export function groundColor(cell: number): Vec3 {
  return groundColors[(cell >>> GroundTypeShift) & GroundTypeMask];
}

export function envOfs(x: number, y: number, z: number): number {
  return (y * 9) + (z * 3) + x;
}

export function envOfsCenter(dx: number, dy: number, dz: number): number {
  return 13 + (dy * 9) + (dz * 3) + dx;
}
