import { Camera } from "./camera";
import { m4, v3 } from "twgl.js";
import Vec3 = v3.Vec3;
import { TAU } from "./math";

export class Controls {
  private a: Vec3;
  private v: Vec3;
  private locked: boolean;
  private theta: number;
  private phi: number;

  constructor(private canvas: HTMLCanvasElement, private camera: Camera) {
    this.a = v3.create();
    this.v = v3.create();
    this.theta = 0;
    this.phi = 0;

    canvas.addEventListener("click", (e) => canvas.requestPointerLock());
    canvas.addEventListener("mousemove", (e) => this.mouseMove(e.movementX, e.movementY));
    document.addEventListener("pointerlockchange", (e) => this.lockChange());
    document.addEventListener("keydown", (e) => this.keyDown(e.code));
    document.addEventListener("keyup", (e) => this.keyUp(e.code));
  }

  tick(dt: number) {
    const xform = this.camera.xform;
    const p = m4.getTranslation(this.camera.xform);

    // Update acceleration->velocity->position.
    const dv = v3.mulScalar(this.a, dt);
    v3.add(this.v, dv, this.v);
    const dp = v3.mulScalar(this.v, dt);
    const tdp = m4.transformDirection(this.camera.xform, dp)
    v3.add(p, tdp, p);

    // Friction.
    v3.mulScalar(this.v, 0.9, this.v);

    // Rotation.
    let rot = m4.rotationY(this.theta)
    m4.multiply(rot, m4.rotationX(this.phi), xform);

    m4.setTranslation(xform, p, xform);
  }

  private lockChange() {
    this.locked = document.pointerLockElement == this.canvas;
  }

  private mouseMove(dx: number, dy: number) {
    if (this.locked) {
      this.theta -= dx / 256;
      this.phi -= dy / 256;
      if (this.phi > TAU / 4) {
        this.phi = TAU / 4;
      } else if (this.phi < -TAU / 4) {
        this.phi = -TAU / 4;
      }
    }
  }

  private keyDown(code: string) {
    switch (code) {
      case 'KeyA': this.a[0] = -1; break;
      case 'KeyD': this.a[0] = +1; break;
      case 'KeyQ': this.a[1] = -1; break;
      case 'KeyE': this.a[1] = +1; break;
      case 'KeyW': this.a[2] = -1; break;
      case 'KeyS': this.a[2] = +1; break;
    }
  }

  private keyUp(code: string) {
    switch (code) {
      case 'KeyA': this.a[0] = 0; break;
      case 'KeyD': this.a[0] = 0; break;
      case 'KeyQ': this.a[1] = 0; break;
      case 'KeyE': this.a[1] = 0; break;
      case 'KeyW': this.a[2] = 0; break;
      case 'KeyS': this.a[2] = 0; break;
    }
  }
}
