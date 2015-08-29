module Eden {

  export class FloorBlock implements BlockType {

    render(env: number[]): BlockGeometry {
      var cube = CSG.cube({ center: [0, 0, 0], radius: [0.5, 0.05, 0.5] });
      return {
        geom: csgPolysToGeometry(cube.toPolygons()),
        mat: new THREE.MeshLambertMaterial({ color: 0x808000 })
      };
    }
  }

  registerBlock(BlockFloor, new FloorBlock());
}
