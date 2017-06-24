/// <reference path="lib/twgl.d.ts"/>
/// <reference path="globals.ts"/>
/// <reference path="client.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="chunk.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="math.ts"/>

module Eden {

  export function main() {
    // Setup canvas and GL context.
    twgl.setAttributePrefix("a_");
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    document.body.appendChild(canvas);
    gl = twgl.getWebGLContext(canvas);

    // Order matters. Yuck.
    initWorldRendering();

    // Kick off the client and hook events.
    var client = new Client("jimmy");
    document.addEventListener("mousemove", (e) => { client.mouseMove(e.clientX, e.clientY); });
    document.addEventListener("keydown", (e: KeyboardEvent) => { client.keyDown(e.keyCode); });
  }
}

Eden.main();
