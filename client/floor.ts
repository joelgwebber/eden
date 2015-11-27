/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>

module Eden {

  export class FloorBlock implements BlockType {

    render(env: number[]): twgl.BufferInfo {
      var cube = CSG.cube({ center: [0, 0, 0], radius: [0.45, 0.05, 0.45] });
      return csgPolysToBuffers(cube.toPolygons());
    }
  }

  registerBlock(BlockFloor, new FloorBlock());
}
