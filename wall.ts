module Eden {

  export class WallBlock implements BlockType {

    constructor() {
    }

    render(env: number[]): BlockGeometry {
      var cube = CSG.cube({ radius: [0.1, 0.5, 0.1] });
      return {
        geom: csgPolysToGeometry(cube.toPolygons()),
        mat: new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })
      };
    }
  }
}
