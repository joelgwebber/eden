/// <reference path="celltypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="cells.ts"/>

module Eden {

  export class FloorCell implements CellType {

    render(env: number[]): twgl.BufferInfo {
      var cube = CSG.cube({ center: [0, 0, 0], radius: [0.45, 0.05, 0.45] });
      return csgPolysToBuffers(cube.toPolygons());
    }
  }

  registerCell(CellFloor, new FloorCell());
}
