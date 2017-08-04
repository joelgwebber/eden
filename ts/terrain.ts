import {ChunkSize} from "./world";
import {cellIndex, makeEnv} from "./chunk";
import {fillCube, marchCube} from "./march";
import {groundColor} from "./cells";
import {gl} from "./eden";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

export function renderTerrain(cells: Uint32Array): twgl.BufferInfo {
  var arrays: {[name: string]: number[]} = { position: [], normal: [], color: [], indices: [] };
  arrays['position']['size'] = 3;
  arrays['normal']['size'] = 3;
  arrays['color']['size'] = 3;

  // Verts.
  var verts = <number[]>arrays["position"];
  var indices = <number[]>arrays["indices"];
  var vertCache: {[key: number]: number} = {}
  for (var y = 1; y < ChunkSize - 1; y++) {
    for (var z = 1; z < ChunkSize - 1; z++) {
      for (var x = 1; x < ChunkSize - 1; x++) {
        // TODO: This is grossly inefficient. We can do a lot better than reusing the 'env' logic.
        var env = makeEnv(cells, x, y, z);
        var cube = fillCube(env);
        marchCube([x, y, z], cube, vertCache, verts, indices);
      }
    }
  }

  // Colors.
  var colors = <number[]>arrays["color"];
  for (var i = 0; i < verts.length; i += 3) {
    var x = Math.floor(verts[i + 0]);
    var y = Math.floor(verts[i + 1]);
    var z = Math.floor(verts[i + 2]);
    var color = groundColor(cells[cellIndex(x, y, z)]);
    colors.push(color[0], color[1], color[2]);
  }

  // Normals.
  // Calculate from faces.
  var normals = <Vec3[]>new Array(verts.length/3);
  for (var i = 0; i < verts.length / 3; i++) {
    normals[i] = v3.create();
  }

  var idx = 0;
  for (var i = 0; i < indices.length / 3; i++) {
    var idx0 = indices[idx+0], idx1 = indices[idx+1], idx2 = indices[idx+2];
    var v0 = [verts[idx0*3 + 0], verts[idx0*3 + 1], verts[idx0*3 + 2]];
    var v1 = [verts[idx1*3 + 0], verts[idx1*3 + 1], verts[idx1*3 + 2]];
    var v2 = [verts[idx2*3 + 0], verts[idx2*3 + 1], verts[idx2*3 + 2]];
    idx += 3;

    var a = v3.subtract(v1, v0);
    var b = v3.subtract(v2, v0);
    var n = v3.cross(a, b);

    v3.add(normals[idx0], n, normals[idx0]);
    v3.add(normals[idx1], n, normals[idx1]);
    v3.add(normals[idx2], n, normals[idx2]);
  }

  var normal = <number[]>arrays["normal"];
  for (var i = 0; i < normals.length; i++) {
    var n = v3.normalize(normals[i]);
    normal.push(-n[0], -n[1], -n[2]);
  }

  return twgl.createBufferInfoFromArrays(gl, arrays);
}
