/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "@/utils/encryption" {
  export function encryptMessage(
    message: string,
    publicKey: string
  ): Promise<string>;
  export function decryptMessage(
    encryptedMessage: string,
    privateKey: string
  ): Promise<string>;
}

declare module "@/utils/websocket" {
  import type { Message, User, WebSocketMessage } from "@/types/message";
  export function setupWebSocket(config: {
    roomId: string;
    userId: string;
    userName: string;
    publicKey: string;
    onConnect: () => void;
    onDisconnect: () => void;
    onMessage: (message: Message) => Promise<void>;
    onUserJoin: (user: User) => void;
    onUserLeave: (userId: string) => void;
    onUserList: (users: User[]) => void;
    onHistory: (history: { messages: Message[] }) => void;
  }): {
    send: (message: WebSocketMessage) => void;
    disconnect: () => void;
  };
}

declare module "@/utils/translation" {
  export function translateText(
    text: string,
    targetLanguage: string
  ): Promise<string>;
}

declare module "@/components/ui/button" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    {
      variant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
      size?: "default" | "sm" | "lg" | "icon";
    },
    {},
    any
  >;
  export { component as Button };
}

declare module "@/components/ui/badge" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    {
      variant?: "default" | "secondary" | "destructive" | "outline";
    },
    {},
    any
  >;
  export { component as Badge };
}

declare module "@/components/ui/scroll-area" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export { component as ScrollArea };
}
