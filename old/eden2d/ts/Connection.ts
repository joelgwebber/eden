module eden {
  import Px = PIXI;
  import Loaders = Px.loaders;

  export interface ConnectionDelegate {
    onConnected(): void;
    onDisconnected(): void;
  }

  export class Connection {
    private _sock: WebSocket;
    private _region: Region;

    constructor(private _root: Px.Container, private _del: ConnectionDelegate) {
      this.connect();
    }

    sendPlayerAction(type: number, args: any[]): void {
      this._sock.send(JSON.stringify(<Message>{
        Type: MessageTypePlayerAction,
        PlayerAction: {
          Type: type,
          Args: args
        }
      }))
    }

    private connect(): void {
      this._sock = new WebSocket("ws://localhost:2112/sock");

      this._sock.onopen = (e: Event) => {
        console.log("socket opened", e);
        this._sock.send(JSON.stringify({
          Type: MessageTypeConnect,
          Connect: {
            Name: "j15r",
            Region: "default"
          }
        }));
      };

      this._sock.onclose = (e: CloseEvent) => {
        console.log("socket closed", e);
        // TODO: Start reconnect loop.
      };

      this._sock.onerror = (e: Event) => {
        console.log("socket error", e);
        // TODO: Decide what to do. Disconnect?
      };

      this._sock.onmessage = (e: MessageEvent) => {
        var msg = <Message>JSON.parse(e.data);
        switch (msg.Type) {
          case MessageTypeConnected:
            this.onConnected(msg.Connected);
            break;
          case MessageTypeRegionUpdate:
            this._region.updateFrom(msg.RegionUpdate);
            break;
          default:
            console.log("unexpected message", msg);
        }
      };
    }

    private onConnected(msg: MessageConnected): void {
      if (this._region) {
        this._root.removeChild(this._region.object());
      }

      this._region = new Region(this._root, msg.Width, msg.Height, msg.Cells, msg.Objects);
      this._root.addChild(this._region.object());
      this._del.onConnected();
    }
  }
}