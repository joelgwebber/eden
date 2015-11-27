/// <reference path="blocktypes.ts"/>

module Eden {

  export interface Plane {
    planeBit: number; // for debugging.
    points: number[];
    hit: number;
    bit?: number;
  }

  // Plane constants. Encoded by normal [xyz] = -1, [XYZ] = 1, _ = 0.
  // All possible normals with values -1, 0, 1, skipping inverses.
  export const PlaneX__ = 0x0001;
  export const Plane_Y_ = 0x0002;
  export const Plane__Z = 0x0004;
  export const PlaneXY_ = 0x0008;
  export const PlaneXy_ = 0x0010;
  export const PlaneX_Z = 0x0020;
  export const PlaneX_z = 0x0040;
  export const Plane_YZ = 0x0080;
  export const Plane_Yz = 0x0100;
  export const PlaneXYZ = 0x0200;
  export const PlaneXYz = 0x0400;
  export const PlaneXyZ = 0x0800;
  export const PlaneXyz = 0x1000;
  export const PlaneCount = 13;

  // Plane -> [normal, du, dv]
  export var PlaneNormals: { [plane: number]: number[][] } = {};
  var AllPlanes: Plane[] = [];

  export function initEnvPlanes() {
    PlaneNormals[PlaneX__] = [[1, 0, 0], [ 0, 1, 0], [ 0, 0, 1]];
    PlaneNormals[Plane_Y_] = [[0, 1, 0], [ 1, 0, 0], [ 0, 0, 1]];
    PlaneNormals[Plane__Z] = [[0, 0, 1], [ 1, 0, 0], [ 0, 1, 0]];
    PlaneNormals[PlaneXY_] = [[1, 1, 0], [ 0, 0, 1], [-1, 1, 0]];
    PlaneNormals[PlaneXy_] = [[1,-1, 0], [ 0, 0, 1], [ 1, 1, 0]];
    PlaneNormals[PlaneX_Z] = [[1, 0, 1], [ 0, 1, 0], [ 1, 0,-1]];
    PlaneNormals[PlaneX_z] = [[1, 0,-1], [ 0, 1, 0], [ 1, 0, 1]];
    PlaneNormals[Plane_YZ] = [[0, 1, 1], [ 1, 0, 0], [ 0,-1, 1]];
    PlaneNormals[Plane_Yz] = [[0, 1,-1], [ 1, 0, 0], [ 0, 1, 1]];
    PlaneNormals[PlaneXYZ] = [[1, 1, 1], [ 1, 0,-1], [-1, 1,-1]];
    PlaneNormals[PlaneXYz] = [[1, 1,-1], [-1, 0,-1], [-1, 1, 1]];
    PlaneNormals[PlaneXyZ] = [[1,-1, 1], [ 1, 0,-1], [ 1, 1, 1]];
    PlaneNormals[PlaneXyz] = [[1,-1,-1], [-1, 0,-1], [ 1, 1,-1]];

    for (var i = 0, planeBit = 1; i < PlaneCount; i++, planeBit <<= 1) {
      addPlane(planeBit);
    }
  }

  function addPlane(planeBit: number) {
    var n = PlaneNormals[planeBit][0];
    var du = PlaneNormals[planeBit][1];
    var dv = PlaneNormals[planeBit][2];

    for (var ofs = -2; ofs <= 2; ofs++) {
      var points: number[] = [];

      for (var u = -2; u <= 2; u++) {
        for (var v = -2; v <= 2; v++) {
          var x = ofs * n[0] + u * du[0] + v * dv[0];
          var y = ofs * n[1] + u * du[1] + v * dv[1];
          var z = ofs * n[2] + u * du[2] + v * dv[2];

          if ((x >= -2) && (x <= 2) &&
              (y >= -2) && (y <= 2) &&
              (z >= -2) && (z <= 2)) {
            points.push(envOfsCenter(x, y, z));
          }
        }
      }

      var p: Plane = { planeBit: planeBit, points: points, hit: 0 };
      if (ofs == 0) {
        p.bit = planeBit;
      }
      AllPlanes.push(p);
    }
  }

  function copyPlane(l: Plane): Plane {
    return { planeBit: l.planeBit, points: l.points, hit: l.hit, bit: l.bit };
  }

  // TODO:
  // - Cache found planes.
  //   When caching, fill all rotations/inversions to avoid redundant work.

  // TODO: Explain.
  export function planeBitsForEnv(env: boolean[]): number {
    // Get bits for filled planes.
    var planes = findAllPlanes(env);
    planes = optimizePlanes(planes, env);

    var bits = 0;
    for (var i = 0; i < planes.length; i++) {
      if (planes[i].bit) {
        bits |= planes[i].bit;
      }
    }

    return bits;
  }

  function findAllPlanes(env: boolean[]): Plane[] {
    var planes: Plane[] = [];
    for (var i = 0; i < AllPlanes.length; ++i) {
      var line = copyPlane(AllPlanes[i]);
      for (var j = 0; j < line.points.length; j++) {
        if (env[line.points[j]]) {
          line.hit++;
        }
      }
      if (line.hit > 0) {
        planes.push(line);
      }
    }
    return planes;
  }

  // Counts the number of blocks set in the given environment.
  function countBlocks(env: boolean[]): number {
    var total = 0;
    for (var i = 0; i < 5 * 5 * 5; i++) {
      if (env[i]) {
        total++;
      }
    }
    return total;
  }

  var _count = 0;
  function optimizePlanes(planes: Plane[], env: boolean[]): Plane[] {
    var total = countBlocks(env);

    // Sort planes by descending size.
    planes.sort((a, b) => {
      return b.hit - a.hit;
    });

    // 'Touched' bits for each cell in the environment.
    var touched: boolean[] = [];
    for (var i = 0; i < 125; i++) {
      touched[i] = false;
    }

    _count = 0;
    return optimizeHelper(planes, total, env, touched);
  }

  function optimizeHelper(planes: Plane[], total: number, env: boolean[], touched: boolean[]): Plane[] {
    // Find all candidate planes of equal size.
    var bestResult: Plane[], bestLength = 100;
    while (true) {
      for (var i = 0; (i < planes.length) && (planes[i].hit == planes[0].hit); i++) {
        var head = planes[i];
        var tail = planes.slice();
        tail = tail.slice(0, i).concat(tail.slice(i + 1));

        var result = optimizePlane(head, tail, total, env, touched.slice()); // Always copy `touched` (TODO: Can skip the first).
        if (result.length && result.length < bestLength) {
          bestResult = result;
          bestLength = result.length;
        }
      }

      if (!bestResult && planes.length > i) {
        // We didn't find anything at len=N, so go ahead and try the next set.
        planes = planes.slice(i);
        continue;
      }

      break;
    }

    return bestResult;
  }

  function optimizePlane(head: Plane, tail: Plane[], total: number, env: boolean[], touched: boolean[]): Plane[] {
    _count++;

    // Walk the line through the environment, updating `total` and `touched`.
    var anythingTouched = false;
    for (var j = 0; j < head.points.length; j++) {
      var ofs = head.points[j];
      if (env[ofs] && !touched[ofs]) {
        anythingTouched = true;
        touched[ofs] = true;
        total--;
      }
    }

    var result: Plane[] = [];
    if (anythingTouched) {
      result.push(head);
      if (total > 0) {
        if (tail.length > 0) {
          var optimized = optimizeHelper(tail, total, env, touched);
          if (optimized) {
            result = result.concat(optimized);
          }
        }
      }
    }

    return result;
  }
}
