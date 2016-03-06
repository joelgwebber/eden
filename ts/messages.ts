module Eden {

  export const MessageTypeConnect = 1;
  export const MessageTypeConnected = 2;
  export const MessageTypeActorState = 3;
  export const MessageTypeChunk = 4;

  export interface Message {
    Type: number;
    Connect?: MessageConnect;
    Connected?: MessageConnected;
    ActorState?: MessageActorState;
    Chunk?: MessageChunk;
  }

  export interface MessageConnect {
    Name: string;
  }

  export interface MessageConnected {
    ActorId: number;
    Pos: Vector;
  }

  export interface MessageActorState {
    Actors: Actor[]
  }

  export interface MessageChunk {
    Loc: Vector;
    Cells: number[];
    Actors: Actor[];
  }

  export interface Actor {
    Id: number;
    Pos: Vector;
  }

  export interface Vector {
    X: number;
    Y: number;
    Z: number;
  }
}
