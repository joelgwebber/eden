/// <reference path="camera.ts"/>
/// <reference path="world.ts"/>
/// <reference path="keys.ts"/>
/// <reference path="messages.ts"/>

module Eden {

  export class Client {
    private _sock: WebSocket;

    private _actorId: number;
    private _world: World;
    private _camera: Camera;

    private _theta = 0;
    private _phi = 0;
    private _target = [2, 2, 2];

    constructor(private _name: string) {
      this._world = new World();
      this._camera = new Camera();
      this.connect();
      this.render();
    }

    mouseMove(x: number, y: number) {
      this._theta = x / 100;
      this._phi   = y / 100;
    }

    keyDown(code: number) {
      var t = this._target;
      switch (code) {
        case KeyW: t[2] -= 1; break;
        case KeyS: t[2] += 1; break;
        case KeyA: t[0] -= 1; break;
        case KeyD: t[0] += 1; break;
        case KeyF: t[1] -= 1; break;
        case KeyR: t[1] += 1; break;

        case KeySpace:
          var cell = this._world.cell(t[0], t[1], t[2]);
          this._world.setCell(t[0], t[1], t[2], (cell != CellAir) ? CellAir : makeCell(CellWall));
          break;
      }
    }

    private connect() {
      var loc = window.location;
      var wsUrl = (loc.protocol === "https:") ? "wss:" : "ws:";
      wsUrl += "//" + loc.host + "/sock";

      this._sock = new WebSocket(wsUrl);
      this._sock.onopen = () => {
        this.sendMessage({
          Type: MessageTypeConnect,
          Connect: { Name: this._name }
        });
      };
      this._sock.onmessage = (e) => {
        this.recvMessage(<Message>JSON.parse(e.data))
      };
    }

    private sendMessage(msg: Message) {
      this._sock.send(JSON.stringify(msg));
    }

    private recvMessage(msg: Message) {
      // console.log(msg);
      switch (msg.Type) {
        case MessageTypeConnected:
          this.handleConnected(msg.Connected);
          break;
        case MessageTypeChunk:
          if ((msg.Chunk.Loc.X >= 0) &&
              (msg.Chunk.Loc.Y >= 0) &&
              (msg.Chunk.Loc.Z >= 0)) {
            console.log(msg.Chunk);
          }
          this.handleChunk(msg.Chunk);
          break;
        case MessageTypeActorState:
          this.handleActorState(msg.ActorState);
          break;
      }
    }

    private handleConnected(conn: MessageConnected) {
      this._actorId = conn.ActorId;
      this._target = [conn.Pos.X, conn.Pos.Y, conn.Pos.Z];
    }

    private handleChunk(chunk: MessageChunk) {
      var loc = chunk.Loc;
      this._world.setChunk(loc.X, loc.Y, loc.Z, chunk.Cells, chunk.Actors);
    }

    private handleActorState(state: MessageActorState) {
      for (var i = 0; i < state.Actors.length; i++) {
        var actor = state.Actors[i];
        if (actor.Id == 0) {
          this._target = [actor.Pos.X, actor.Pos.Y, actor.Pos.Z];
        }

        // ...
      }
    }

    private render() {
      requestAnimationFrame(() => { this.render(); });

      var t = this._target;
      var cx = 8 * Math.cos(this._theta);
      var cy = 6;
      var cz = 8 * Math.sin(this._theta);
      this._camera.setPosition([t[0] + cx, t[1] + cy, t[2] + cz]);
      this._camera.lookAt([t[0], t[1], t[2]], [0, 1, 0]);

      gl.canvas.width = window.innerWidth;
      gl.canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      this._camera.setAspect(gl.canvas.offsetWidth / gl.canvas.offsetHeight);
      this._camera.update();
      this._world.update();

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0x7e/0x100, 0xc0/0x100, 0xee/0x100, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      this._world.render(this._camera);
    }
  }
}
