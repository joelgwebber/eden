/// <reference path="lib/twgl.d.ts"/>

import {initWorldRendering} from "./chunk";
import {Client} from "./client";
import {gl, initGlobals} from "./globals";

export function main() {
  // Setup canvas and GL context.
  twgl.setAttributePrefix("a_");
  var canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  document.body.appendChild(canvas);

  initGlobals(canvas);
  initWorldRendering();

  // Kick off the client and hook events.
  var client = new Client("jimmy");
  document.addEventListener("mousemove", (e) => { client.mouseMove(e.clientX, e.clientY); });
  document.addEventListener("keydown", (e: KeyboardEvent) => { client.keyDown(e.keyCode); });
}

main();
