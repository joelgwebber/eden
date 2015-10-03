/// <reference path="lib/twgl.d.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="world.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>

module Eden {
  export var gl: WebGLRenderingContext;
  var world: World;
  var camera: Camera;

  export class Camera {
    private _mat = m4.identity();
    private _view = m4.identity();
    private _viewProjection = m4.identity();

    private aspect = 1;

    setPosition(pos: Vec3) {
      m4.setTranslation(this._mat, pos, this._mat);
    }

    lookAt(target: Vec3, up: Vec3) {
      this._mat = m4.lookAt(m4.getTranslation(this._mat), target, up);
    }

    setAspect(aspect: number) {
      this.aspect = aspect;
    }

    update() {
      var projection = m4.perspective(30 * Math.PI / 180, this.aspect, 0.1, 1000);
      m4.inverse(this._mat, this._view);
      m4.multiply(this._view, projection, this._viewProjection);
    }

    view(): Mat4 {
      return this._view;
    }

    viewProjection(): Mat4 {
      return this._viewProjection;
    }
  }

  function init() {
    twgl.setAttributePrefix("a_");

    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    document.body.appendChild(canvas);

    gl = twgl.getWebGLContext(canvas);

    world = new World();
    camera = new Camera();
    camera.setPosition([5, 15, -15]);
    camera.lookAt([5, 2, 5], [0, 1, 0]);
  }

  function render() {
    requestAnimationFrame(render);

    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // controls.update(clock.getDelta());
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
