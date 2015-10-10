/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>
/// <reference path="envlines.ts"/>
/// <reference path="envplanes.ts"/>

module Eden {

  // TODO: Don't actually need these.
  export const EAST = 0x01;      // +du  0
  export const WEST = 0x02;      // -du  0
  export const SOUTH = 0x04;     //  0  +dv
  export const NORTH = 0x08;     //  0  -dv
  export const SOUTHEAST = 0x10; // +du +dv
  export const NORTHWEST = 0x20; // -du -dv
  export const NORTHEAST = 0x40; // +du -dv
  export const SOUTHWEST = 0x80; // -du +dv

  // plane -> dir -> [point on plane]
  var planePoints: { [plane: number]: { [dir: number]: number[] } } = {};

  // plane -> dir -> [center, radius]
  var planePieces: { [plane: number]: { [dir: number]: number[][] } } = {}

  export function initWall() {
    // Initialize one planePoints list for each plane type.
    for (var i = 0, planeBit = 1; i < PlaneCount; i++, planeBit <<= 1) {
      var points: { [dir: number]: number[] } = [];
      var du = PlaneNormals[planeBit][1], dv = PlaneNormals[planeBit][2];

      points[EAST] =  [+du[0], +du[1], +du[2]];
      points[WEST] =  [-du[0], -du[1], -du[2]];
      points[SOUTH] = [+dv[0], +dv[1], +dv[2]];
      points[NORTH] = [-dv[0], -dv[1], -dv[2]];

      points[SOUTHEAST] = [+du[0] +dv[0], +du[1] +dv[1], +du[2] +dv[2]];
      points[NORTHWEST] = [-du[0] -dv[0], -du[1] -dv[1], -du[2] -dv[2]];
      points[NORTHEAST] = [+du[0] -dv[0], +du[1] -dv[1], +du[2] -dv[2]];
      points[SOUTHWEST] = [-du[0] +dv[0], -du[1] +dv[1], -du[2] +dv[2]];

      planePoints[planeBit] = points;
    }

    // Initialize plane piece models.
    for (var i = 0, planeBit = 1; i < PlaneCount; i++, planeBit <<= 1) {
      var pieces: { [dir: number]: number[][] } = {};
      var points = planePoints[planeBit];

      // Just 1/3 cubes for now.
      for (var j = 0, dirBit = 1; j < 8; j++, dirBit <<= 1) {
        var p = points[dirBit];
        pieces[dirBit] = [
          [p[0] * (1/3), p[1] * (1/3), p[2] * (1/3)],
          [(1/6), (1/6), (1/6)]
        ];
      }

      planePieces[planeBit] = pieces;
    }
  }

  export class WallBlock implements BlockType {

    render(env: number[]): twgl.BufferInfo {
      var planeBits = planeBitsForEnv(env);

      // Now render all the walls.
      // Start with a box.
      // var csg = CSG.cube({ radius: [0.125, 0.125, 0.125] });
      var csg = CSG.cube({ radius: [(1/6), (1/6), (1/6)] });

      // Then add the planes.
      for (var i = 0, planeBit = 1; i < PlaneCount; i++, planeBit <<= 1) {
        if (planeBits & planeBit) {
          csg = renderPlane(env, planeBit, csg);
        }
      }

      return csgPolysToBuffers(csg.toPolygons());
    }
  }

  function renderPlane(env: number[], plane: number, csg: CSG.Model): CSG.Model {
    var dirBits = dirBitsForPlane(env, plane);

    var piece = planePieces[plane];
    for (var i = 0, dirBit = 1; i < 8; i++, dirBit <<= 1) {
      if (dirBits & dirBit) {
        csg = csg.union(CSG.cube({ center: piece[dirBit][0], radius: piece[dirBit][1] }));
      }
    }

    return csg;
  }

  // TODO: Not remotely complete. We really need a way to sort out hard corners and angles.
  function dirBitsForPlane(env: number[], plane: number): number {
    var dirBits = 0;
    var points = planePoints[plane];
    for (var i = 0, dirBit = 1; i < 8; i++, dirBit <<= 1) {
      var p = points[dirBit];
      if (env[envOfsCenter(p[0], p[1], p[2])] == BlockWall) {
        dirBits |= dirBit;
      }
    }
    return dirBits;
  }

  function xform(eighth: number): number[] {
    var m = m4.rotationY(eighth * TAU / 8);
    return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  }

  registerBlock(BlockWall, new WallBlock());
}
