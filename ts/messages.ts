
module Eden {

  export const MessageTypeConnect = 1;
  export const MessageTypePlayerState = 2;

  export interface Message {
    Type: number;
    Connect?: MessageConnect;
    PlayerState?: MessagePlayerState;
  }

  export interface MessageConnect {
    Name: string;
  }

  export interface MessagePlayerState {
    X: number;
    Y: number;
    Z: number;
  }
}
