import {gl, View, worldProgram, WorldUniforms} from "./eden";
import {World} from "./world";
import {Camera} from "./camera";
import {clamp, cos, sin, Tau} from "./math";
import * as proto from "./protocol";
import * as csg from "./csg";
import * as key from "./keys";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;
import {CommandMove} from "./protocol";
import {Chunk, vecFromPos} from "./chunk";

const DefaultTheta = -Tau / 4;
const MinTheta = -Tau / 2 + Tau / 16;
const MaxTheta = 0 - Tau / 16;

const DefaultPhi = 7 * Tau / 8;
const MinPhi = 3 * Tau / 4;
const MaxPhi = Tau - Tau / 16;

export class Client implements View {
  private _sock: WebSocket;

  private _playerObjId: number;
  private _world: World;
  private _camera: Camera;

  private _theta = DefaultTheta;
  private _phi = DefaultPhi;

  constructor(private _name: string) {
    this._world = new World();
    this._camera = new Camera();
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
    switch (keyCode) {
      case key.KeyW: this.move( 0,  0,  1); break;
      case key.KeyS: this.move( 0,  0, -1); break;
      case key.KeyA: this.move(-1,  0,  0); break;
      case key.KeyD: this.move( 1,  0,  0); break;
      case key.KeyF: this.move( 0, -1,  0); break;
      case key.KeyR: this.move( 0,  1,  0); break;
    }
  }

  private move(dx: number, dy: number, dz: number) {
    this.sendMessage({
      Type: proto.MessageTypePlayerCmd,
      PlayerCmd: {Cmd: CommandMove, Args: [dx, dy, dz] }
    });
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
      case proto.MessageTypePlayerObj:
        this.handlePlayerObj(msg.PlayerObj);
        break;
      case proto.MessageTypeChunk:
        this.handleChunk(msg.Chunk);
        break;
    }
  }

  private handlePlayerObj(player: proto.MessagePlayerObj) {
    this._playerObjId = player.PlayerObjId;
  }

  private handleChunk(chunk: proto.MessageChunk) {
    var loc = chunk.Loc;
    for (let mut of chunk.Muts) {
      this._world.mutate(loc.X, loc.Y, loc.Z, mut);
    }
  }

  private playerObjet(): [proto.Objet, Chunk] {
    return this._world.findObjet(this._playerObjId);
  }

  render() {
    let [obj, chunk] = this.playerObjet();
    if (!obj) {
      return;
    }

    var pos = vecFromPos(obj.Pos);
    var t = v3.add(pos, chunk.offset());
    var cx = 16 * (cos(this._theta) * sin(this._phi));
    var cy = 16 * cos(this._phi);
    var cz = 16 * (sin(this._theta) * sin(this._phi));
    this._camera.setPosition([t[0] + cx, t[1] + cy, t[2] + cz]);
    this._camera.lookAt([t[0], t[1], t[2]], [0, 1, 0]);
    this._camera.update();

    this._world.update();
    this._world.render(this._camera);
  }
}
