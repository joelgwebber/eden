/// <reference path="celltypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="march.ts"/>
/// <reference path="math.ts"/>

module Eden {

  import Vec3 = twgl.v3.Vec3;
  import Mat4 = twgl.m4.Mat4;

  // TODO: Rendering the marching-cube surface one cell at a time is a terrible idea.
  // Move marching-cubes into its own pass, identifying all participating cell types
  // with a special bit.
  export class GroundCell implements CellType {

    render(env: number[]): twgl.BufferInfo {
      var arrays: {[name: string]: number[]} = { position: [], normal: [], color: [], indices: [] };
      arrays['position']['size'] = 3;
      arrays['normal']['size'] = 3;
      arrays['color']['size'] = 3;

      var cube = fillCube(env);
      var vertIndex: {[key: number]: number} = {}
      var verts = <number[]>arrays["position"];
      var indices = <number[]>arrays["indices"];
      marchCube(<Vec3>[0, 0, 0], cube, vertIndex, verts, indices);

      var normal = <number[]>arrays["normal"];
      var color = <number[]>arrays["color"];
      for (var i = 0; i < verts.length / 3; i++) {
        normal.push(0, 1, 0);
        color.push(0, 1, 0);
      }
      return twgl.createBufferInfoFromArrays(gl, arrays);
    }
  }

  registerCell(CellGround, new GroundCell());
}

// TODO: Use something like this to fix normals.
// void Region::CalculateNormals(Vector3 * normals) {
//   for (int y = -1; y < RegionData::Size + 1; y++) {
//     for (int z = -1; z < RegionData::Size + 1; z++) {
//       for (int x = -1; x < RegionData::Size + 1; x++) {
//         float dx = data_ ->CellAt(x + 1, y, z) ->density - data_ ->CellAt(x - 1, y, z) ->density;
//         float dy = data_ ->CellAt(x, y + 1, z) ->density - data_ ->CellAt(x, y - 1, z) ->density;
//         float dz = data_ ->CellAt(x, y, z + 1) ->density - data_ ->CellAt(x, y, z - 1) ->density;
// 
//         int idx = (x + 2) + (y + 2) * RegionData::Stride + (z + 2) * RegionData::Stride2;
//         normals[idx] = Vector3(dx, dy, dz);
//         normals[idx].Normalize();
//       }
//     }
//   }
// }
