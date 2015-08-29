module Eden {

  export class WallBlock implements BlockType {

    render(env: number[]): BlockGeometry {
      // Start with a pillar.
      var csg = CSG.cube({ radius: [0.1, 0.5, 0.1] });

      // X wall.
      if (env[EnvWest] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }
      if (env[EnvEast] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }

      // Y wall.
      if (env[EnvSouth] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0, 0, -0.25], radius: [0.1, 0.5, 0.25] }));
      }
      if (env[EnvNorth] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0, 0, 0.25], radius: [0.1, 0.5, 0.25] }));
      }

      // XY wall.
      if (env[EnvNorthWest] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }

      return {
        geom: csgPolysToGeometry(csg.toPolygons()),
        mat: new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })
      };
    }
  }

  registerBlock(BlockWall, new WallBlock());
}
