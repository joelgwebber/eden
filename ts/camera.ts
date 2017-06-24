
import v3 = twgl.v3;
import m4 = twgl.m4;
import Vec3 = twgl.v3.Vec3;
import Mat4 = twgl.m4.Mat4;

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
