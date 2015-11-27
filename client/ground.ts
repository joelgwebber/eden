/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="march.ts"/>
/// <reference path="math.ts"/>

module Eden {

  import Vec3 = twgl.v3.Vec3;
  import Mat4 = twgl.m4.Mat4;

  // TODO: Rendering the marching-cube surface one cell at a time is a terrible idea.
  // Move marching-cubes into its own pass, identifying all participating cell types
  // with a special bit.
  export class GroundBlock implements BlockType {

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

  registerBlock(BlockGround, new GroundBlock());
}
