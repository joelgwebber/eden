import {gl, View, worldProgram, WorldUniforms} from "./eden";
import {World} from "./world";
import {Camera} from "./camera";
import {clamp, cos, sin, Tau} from "./math";
import * as key from "./keys"
import * as proto from "./protocol";
import * as cells from "./cells";
import * as csg from "./csg";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

const DefaultTheta = -Tau / 4;
const MinTheta = -Tau / 2 + Tau / 16;
const MaxTheta = 0 - Tau / 16;

const DefaultPhi = 7 * Tau / 8;
const MinPhi = 3 * Tau / 4;
const MaxPhi = Tau - Tau / 16;

export class Client implements View {
  private _sock: WebSocket;

  private _actorId: number;
  private _world: World;
  private _camera: Camera;

  private _theta = DefaultTheta;
  private _phi = DefaultPhi;
  private _target = [0, 0, 0];

  private _cursor: twgl.BufferInfo;

  constructor(private _name: string) {
    this._world = new World();
    this._camera = new Camera();

    var cube = csg.cube({ center: [0.5, 0.5, 0.5], radius: [0.5, 0.5, 0.5] });
    this._cursor = csg.polysToBuffers(cube.toPolygons());
  }

  create() {
    this.connect();
  }

  destroy() {
  }

  mouseMove(dx: number, dy: number) {
    this._theta = clamp(this._theta + dx / 64, MinTheta, MaxTheta);
    this._phi   = clamp(this._phi + dy / 64, MinPhi, MaxPhi);
  }

  keyDown(keyCode: number) {
    var t = this._target;
    switch (keyCode) {
      case key.KeyW: t[2] -= 1; break;
      case key.KeyS: t[2] += 1; break;
      case key.KeyA: t[0] -= 1; break;
      case key.KeyD: t[0] += 1; break;
      case key.KeyF: t[1] -= 1; break;
      case key.KeyR: t[1] += 1; break;
    }
  }

  private connect() {
    var loc = window.location;
    var wsUrl = (loc.protocol === "https:") ? "wss:" : "ws:";
    wsUrl += "//" + loc.host + "/sock";

    this._sock = new WebSocket(wsUrl);
    this._sock.onopen = () => {
      this.sendMessage({
        Type: proto.MessageTypeConnect,
        Connect: { Name: this._name }
      });
    };
    this._sock.onmessage = (e) => {
      this.recvMessage(<proto.Message>JSON.parse(e.data))
    };
  }

  private sendMessage(msg: proto.Message) {
    this._sock.send(JSON.stringify(msg));
  }

  private recvMessage(msg: proto.Message) {
    switch (msg.Type) {
      case proto.MessageTypeConnected:
        this.handleConnected(msg.Connected);
        break;
      case proto.MessageTypeChunk:
        this.handleChunk(msg.Chunk);
        break;
      case proto.MessageTypeActorState:
        this.handleActorState(msg.ActorState);
        break;
    }
  }

  private handleConnected(conn: proto.MessageConnected) {
    this._actorId = conn.ActorId;
    this._target = [conn.Pos.X, conn.Pos.Y, conn.Pos.Z];
  }

  private handleChunk(chunk: proto.MessageChunk) {
    var loc = chunk.Loc;
    this._world.setChunk(loc.X, loc.Y, loc.Z, chunk.Terrain, chunk.Actors);
  }

  private handleActorState(state: proto.MessageActorState) {
    for (var i = 0; i < state.Actors.length; i++) {
      var actor = state.Actors[i];
      if (actor.Id == 0) {
        this._target = [actor.Pos.X, actor.Pos.Y, actor.Pos.Z];
      }

      // ...
    }
  }

  render() {
    var t = this._target;
    var cx = 16 * (cos(this._theta) * sin(this._phi));
    var cy = 16 * cos(this._phi);
    var cz = 16 * (sin(this._theta) * sin(this._phi));
    this._camera.setPosition([t[0] + cx, t[1] + cy, t[2] + cz]);
    this._camera.lookAt([t[0], t[1], t[2]], [0, 1, 0]);
    this._camera.update();

    this._world.update();

    var uniforms: WorldUniforms = {
      u_ambient: [0.3, 0.3, 0.3],
      u_lightDir: v3.normalize([1, 2, 3]),
      u_viewProjection: this._camera.viewProjection(),
      u_model: m4.translation(t)
    };

    gl.useProgram(worldProgram.program);
    twgl.setBuffersAndAttributes(gl, worldProgram, this._cursor);
    twgl.setUniforms(worldProgram, uniforms);
    gl.drawElements(gl.TRIANGLES, this._cursor.numElements, gl.UNSIGNED_SHORT, 0);

    this._world.render(this._camera);
  }
}
