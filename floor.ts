/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>

module Eden {

  export class FloorBlock implements BlockType {

    render(env: number[]): BlockGeometry {
      var cube = CSG.cube({ center: [0, 0, 0], radius: [0.45, 0.05, 0.45] });
      return {
        geom: csgPolysToGeometry(cube.toPolygons()),
        mat: new THREE.MeshLambertMaterial({ color: 0x808000 })
      };
    }
  }

  registerBlock(BlockFloor, new FloorBlock());
}
