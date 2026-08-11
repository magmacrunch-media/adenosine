export interface ChatWidget {
  connect(): void;
  disconnect(): void;
  joinRoom(code: string): void;
  leaveRoom(code: string): void;
  setName(name: string): void;
  setColor(color: string): void;
  expand(): void;
  minimize(): void;
  getMyName(): string | null;
  getMyColor(): string | null;
  getCurrentRoom(): string | null;
}

export declare const ChatWidget: ChatWidget;
