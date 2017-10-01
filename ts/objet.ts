import {gl, worldProgram, WorldUniforms} from "./eden";
import {ChunkInterior} from "./world";
import {Camera} from "./camera";
import * as proto from "./protocol";
import * as csg from "./csg";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

function meshForObjet(obj: proto.Objet): twgl.BufferInfo {
  var cube = csg.cube({ center: [0.5, 0.5, 0.5], radius: [0.5, 0.5, 0.5] });
  return csg.polysToBuffers(cube.toPolygons());
}

export function renderObjet(camera: Camera, obj: proto.Objet, xform: Mat4) {
  if (!obj.mesh) {
    obj.mesh = meshForObjet(obj);
  }

  var uniforms: WorldUniforms = {
    u_ambient: [0.3, 0.3, 0.3],
    u_lightDir: v3.normalize([1, 2, 3]),
    u_viewProjection: camera.viewProjection(),
    u_model: xform
  };

  twgl.setBuffersAndAttributes(gl, worldProgram, obj.mesh);
  twgl.setUniforms(worldProgram, uniforms);
  gl.drawElements(gl.TRIANGLES, obj.mesh.numElements, gl.UNSIGNED_SHORT, 0);

  // TODO: Containers that render their children.
}
