import { ServerRequest } from "https://deno.land/std@0.95.0/http/server.ts";
import { acceptWebSocket, WebSocket } from "https://deno.land/std@0.95.0/ws/mod.ts";

import { Registry } from "../api/Registry.ts";

export class Socket {
  private static sockets: Set<WebSocket> = new Set();
  private static listeners: { [event: string]: Function[] } = {};

  private static async handleConnection(socket: WebSocket) {
    try {
      Socket.sockets.add(socket);
      for await (const message of socket) {
        const { event, data } = JSON.parse(message as string);
        if (event.startsWith('__rmi:invoke')) {
          await socket.send(JSON.stringify({
            event,
            data: await Registry.registries[event](...data)
          }));
        }
        Socket.listeners[event]?.forEach(listener => {
          listener(data);
        });
      }
    } catch (err) {
      Socket.sockets.delete(socket);
      if (!socket.isClosed) {
        await socket.close(1000).catch(console.error);
      }
    }
  }

  static on(event: string, listener: Function) {
    if (event in Socket.listeners) {
      Socket.listeners[event].push(listener);
    } else {
      Socket.listeners[event] = [ listener ];
    }
  }

  static invoke(event: string, data: any) {
    Socket.sockets.forEach(socket => {
      socket.send(JSON.stringify({event, data}));
    });
  }

  static async handleRequest(req: ServerRequest) {
    try {
      const { conn, r: bufReader, w: bufWriter, headers } = req;
      const socket = await acceptWebSocket({ conn, bufReader, bufWriter, headers });
      Socket.handleConnection(socket);
    } catch (error) {
      console.error(`failed to accept websocket: ${error}`);
      await req.respond({ status: 400 });
    }
  }
}
