/// <reference path="lib/twgl.d.ts"/>
/// <reference path="globals.ts"/>
/// <reference path="envplanes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="camera.ts"/>
/// <reference path="world.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="math.ts"/>
/// <reference path="keys.ts"/>

module Eden {

  var world: World;
  var camera: Camera;

  var theta = 0, phi = 0;
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

    document.addEventListener("mousemove", (e: MouseEvent) => {
      theta = e.clientX / 100;
      phi   = e.clientY / 100;
    });

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
          chunk.setCell(target[0], target[1], target[2], cell ? CellAir : terrainCell(CellGrass, 1.0));
          break;
      }
    });
  }

  function render() {
    requestAnimationFrame(render);

    var cx = 8 * Math.cos(theta);
    var cy = 6;
    var cz = 8 * Math.sin(theta);
    camera.setPosition([target[0] + cx, target[1] + cy, target[2] + cz]);
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

  function ws() {
    var socket = new WebSocket('ws://localhost:2112');
    socket.onopen = () => {
      socket.send("wut?");
    };
    socket.onmessage = (message) => {
      console.log('Connection 1', message.data);
    };
  }

  export function main() {
    ws();
    init();
    render();
  }
}

Eden.main();
