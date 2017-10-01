export interface Location {
  X: number;
  Y: number;
  Z: number;
}

export interface Delta {
  DX: number;
  DY: number;
  DZ: number;
}

export const MessageTypeConnect = 1;
export const MessageTypePlayerObj = 2;
export const MessageTypeChunk = 3;
export const MessageTypePlayerCmd = 4;

export const CommandMove = "move";

export interface Message {
  Type: number;
  Connect?: MessageConnect;
  PlayerObj?: MessagePlayerObj;
  Chunk?: MessageChunk;
  PlayerCmd?: MessageChunkPlayerCmd;
}

export interface MessageConnect {
  Name: string;
}

export interface MessagePlayerObj {
  PlayerObjId: number;
}

export interface MessageChunk {
  Loc: Location;
  Muts: Mutation[];
}

export interface Mutation {
  Terrain: number[];
  Objets: {[id: number]: Objet};
}

export interface MessageChunkPlayerCmd {
	Cmd:  string;
	Args: number[];
}

export interface Objet {
  Id: number;
  Type: number;
  Pos: number;

  // Local state:
  mesh: twgl.BufferInfo;
}
