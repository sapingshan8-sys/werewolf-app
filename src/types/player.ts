export type Player = {
  name: string;
  character?: string;
  ready: boolean;

  role?: string;
  alive?: boolean;
  eliminationReason?: "coldSleep" | "attack" | "bug";
  chatId?: string;
  eveningFinished?: boolean;
};
