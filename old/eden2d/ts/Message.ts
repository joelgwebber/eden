module eden {

  export const MessageTypeConnect      = 0;
  export const MessageTypeConnected    = 1;
  export const MessageTypeRegionUpdate = 2;
  export const MessageTypePlayerAction = 3;

  export const PlayerActionMove    = 0; // [MoveDir]
  export const PlayerActionPlace   = 1; // [ObjectType, Position]

  export const MoveNorth = 1;
  export const MoveSouth = 2;
  export const MoveWest  = 3;
  export const MoveEast  = 4;

  export interface Message {
    Type: number;
    Connect: MessageConnect;
    Connected: MessageConnected;
    RegionUpdate: MessageRegionUpdate;
    PlayerAction: MessagePlayerAction;
  }

  export interface MessageConnect {
    Name: string;
    Region: string;
  }

  export interface MessageConnected {
    Width: number;
    Height: number;
    Cells: number[];
    Objects: ObjectRecord[];
  }

  export interface TileRecord {
    I: number; // y * width + x + cell
    V: number; // new value
  }

  export interface ObjectRecord {
    I: number; // Id
    T: number; // Type -- 0 == remove
    P: number; // Pos
    N: number; // Next
  }

  export interface MessageRegionUpdate {
    TileRecs: TileRecord[];
    ObjectRecs: ObjectRecord[];
  }

  export interface MessagePlayerAction {
    Type: number;
    Args: any[];
  }
}
