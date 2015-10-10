/// <reference path="lib/twgl.d.ts"/>
/// <reference path="envplanes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="camera.ts"/>
/// <reference path="world.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>
/// <reference path="keys.ts"/>

module Eden {

  export var gl: WebGLRenderingContext;

  var world: World;
  var camera: Camera;

  var target = [2, 2, 2];

  function init() {
    // Order matters. Yuck.
    initEnvPlanes();
    initWall();

    twgl.setAttributePrefix("a_");

    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    document.body.appendChild(canvas);

    gl = twgl.getWebGLContext(canvas);

    world = new World();
    camera = new Camera();
    camera.setPosition([10, 10, 10]);
    camera.lookAt([3, 3, 3], [0, 1, 0]);

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case KeyW: target[2] -= 1; break;
        case KeyS: target[2] += 1; break;
        case KeyA: target[0] -= 1; break;
        case KeyD: target[0] += 1; break;
        case KeyF: target[1] -= 1; break;
        case KeyR: target[1] += 1; break;

        case KeySpace:
          var chunk = world.chunk(0, 0, 0);
          var cell = chunk.cell(target[0], target[1], target[2]);
          chunk.setCell(target[0], target[1], target[2], cell ? BlockAir : BlockWall);
          break;
      }
    });
  }

  function render() {
    requestAnimationFrame(render);

    camera.setPosition([target[0] + 8, target[1] + 8, target[2] + 8]);
    camera.lookAt([target[0], target[1], target[2]], [0, 1, 0]);

    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    camera.setAspect(gl.canvas.offsetWidth / gl.canvas.offsetHeight);
    camera.update();
    world.update();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0x7e/0x100, 0xc0/0x100, 0xee/0x100, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    world.render(camera);
  }

  export function main() {
    init();
    render();
  }
}

Eden.main();
