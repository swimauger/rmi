import { serve, ServerRequest } from "https://deno.land/std@0.95.0/http/server.ts";
import { Socket } from "./Socket.ts";
import { Registry } from "../api/Registry.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";

const __dirname = new URL('.', import.meta.url).pathname as string;

type RequestHandler = (req: ServerRequest) => void;

type Route = { [url: string]: RequestHandler };

type Routes = {
  [method: string]: Route
};

export class http {
  private static rmiScript: string = Deno.readTextFileSync(__dirname.replace('net/', 'api/client/rmi.js'));
  private static routes: Routes = {};

  static get(url: string, handler: RequestHandler) {
    http.routes.get ? http.routes.get[url] = handler : http.routes.get = { [url]: handler };
  }

  static head(url: string, handler: RequestHandler) {
    http.routes.head ? http.routes.head[url] = handler : http.routes.head = { [url]: handler };
  }

  static post(url: string, handler: RequestHandler) {
    http.routes.post ? http.routes.post[url] = handler : http.routes.post = { [url]: handler };
  }

  static put(url: string, handler: RequestHandler) {
    http.routes.put ? http.routes.put[url] = handler : http.routes.put = { [url]: handler };
  }

  static delete(url: string, handler: RequestHandler) {
    http.routes.delete ? http.routes.delete[url] = handler : http.routes.delete = { [url]: handler };
  }
  
  static connect(url: string, handler: RequestHandler) {
    http.routes.connect ? http.routes.connect[url] = handler : http.routes.connect = { [url]: handler };
  }
  
  static options(url: string, handler: RequestHandler) {
    http.routes.options ? http.routes.options[url] = handler : http.routes.options = { [url]: handler };
  }
  
  static trace(url: string, handler: RequestHandler) {
    http.routes.trace ? http.routes.trace[url] = handler : http.routes.trace = { [url]: handler };
  }
  
  static patch(url: string, handler: RequestHandler) {
    http.routes.patch ? http.routes.patch[url] = handler : http.routes.patch = { [url]: handler };
  }

  static async listen(port: number) {
    for (const bundleName in Registry.bundles) {
      http.get(`/rmi/${bundleName}`, async (req) => {
        req.respond({
          body: `${http.rmiScript}\nrmi.socket.id = '${v4.generate()}';\n${Registry.bundles[bundleName]}`
        });
      });
    }

    for await (const req of serve({ port })) {
      if (req.headers.get('upgrade') === 'websocket') {
        await Socket.handleRequest(req);
      } else {
        await http.routes[req.method.toLowerCase()][req.url]?.(req);
      }
    }
  }
}
