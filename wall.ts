/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>
/// <reference path="envlines.ts"/>

module Eden {
  var Root2 = Math.sqrt(2);
  var TwoRoot2 = 2 * Root2;

  export class WallBlock implements BlockType {
    render(env: number[]): twgl.BufferInfo {
      var bits = bitsForEnv(env);

      // Now render all the walls.
      // Start with a pillar (TODO: Drop the pillar if there are other walls).
      // TODO: Start with empty model if any pair of opposite walls is present (east-west, etc).
      var csg = CSG.cube({ radius: [0.1, 0.5, 0.1] });

      // X wall.
      if (bits & EAST_BIT) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }
      if (bits & WEST_BIT) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }

      // Z wall.
      if (bits & SOUTH_BIT) {
        csg = csg.union(CSG.cube({ center: [0, 0, 0.25], radius: [0.1, 0.5, 0.25] }));
      }
      if (bits & NORTH_BIT) {
        csg = csg.union(CSG.cube({ center: [0, 0, -0.25], radius: [0.1, 0.5, 0.25] }));
      }

      // XZ wall.
      if (bits & SOUTHEAST_BIT) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(3) }));
      }
      if (bits & NORTHWEST_BIT) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, -0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(7) }));
      }

      // ZX wall.
      if (bits & NORTHEAST_BIT) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, -0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(5) }));
      }
      if (bits & SOUTHWEST_BIT) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(1) }));
      }

      return csgPolysToBuffers(csg.toPolygons());
    }
  }

  function xform(eighth: number): number[] {
    var m = m4.rotationY(eighth * TAU / 8);
    return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  }

  registerBlock(BlockWall, new WallBlock());
}
