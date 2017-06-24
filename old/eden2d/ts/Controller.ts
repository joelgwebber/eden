
module eden {

  export interface ControllerDelegate {
    onPlayerAction(type: number, args: any[]);
  }

  export class Controller {

    constructor(private _del: ControllerDelegate) {
      window.addEventListener("keydown", (e: KeyboardEvent) => {
        switch (e.keyCode) {
          case 38: this._del.onPlayerAction(PlayerActionMove, [MoveNorth]); break;
          case 40: this._del.onPlayerAction(PlayerActionMove, [MoveSouth]); break;
          case 37: this._del.onPlayerAction(PlayerActionMove, [MoveWest]); break;
          case 39: this._del.onPlayerAction(PlayerActionMove, [MoveEast]); break;
          case 32: this._del.onPlayerAction(PlayerActionPlace, [ObjectBook, PosDefault]); break;
        }
      });
    }

    onConnected(): void {
    }

    onDisconnected(): void {
    }
  }
}
