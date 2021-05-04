import { ServerRequest } from "https://deno.land/std@0.95.0/http/server.ts";
import { http } from "../net/http.ts";
import { Socket } from '../net/Socket.ts';

const hash = (function* () {
  for (let i = 0; true; i++) {
    yield `__rmi:invoke${i}`;
  }
})();

export class Registry {
  public static registries: { [invokeId: string]: any } = {};
  public static bundles: { [bundle: string]: string } = {};

  private static getConstructorAruments(remoteObject: any) {
    return remoteObject.toString().match(/constructor.*\)/)?.[0]?.replace(/constructor\(|\)/g, '') || '';
  }

  static createServer(port: number) {
    http.listen(port);
  }

  static registerRoute(route: {
    path: string,
    method: 'get' | 'head' | 'post' | 'put' | 'delete' | 'connect' | 'options' | 'trace' | 'patch'
    response: (req: ServerRequest) => void
  }) {
    http[route.method](route.path, route.response);
  }

  static registerRemoteObject(remoteObject: any) {
    if (remoteObject instanceof Function) {
      const args = Registry.getConstructorAruments(remoteObject);
      let constructor = '';
      let bundle = '';

      // Iterate static properties
      for (const key of Object.getOwnPropertyNames(remoteObject)) {
        const func = remoteObject[key].toString().replace(/.*\(/, 'function(');
        const id = hash.next().value;
        switch (remoteObject[key].__side) {
          case 'serialized':
            bundle += `${remoteObject.name}['${key}'] = ${func};\n\n`;
            break;
          case 'client':
            remoteObject[key] = (...args: any[]) => {
              Socket.invoke(id, args);
            };
            bundle += `rmi.socket.on('${id}', ${func}.bind(this));\n`;
            break;
          case 'server':
            bundle += `${remoteObject.name}['${key}'] = function(...args) {
              return new Promise(async resolve => {
                await rmi.socket.ready;
                rmi.socket.on('${id}', resolve);
                rmi.socket.send('${id}', args);
              });
            }\n\n`;
            Registry.registries[id] = remoteObject[key];
            break;
        }
      }

      // Iterate instance properties
      for (const key of Object.getOwnPropertyNames(remoteObject.prototype)) {
        const func = remoteObject.prototype[key].toString().replace(/.*\(/, 'function(');
        const id = hash.next().value;
        switch (remoteObject.prototype[key].__side) {
          case 'serialized':
            bundle += `${remoteObject.name}.prototype['${key}'] = ${func};\n\n`;
            break;
          case 'client':
            remoteObject.prototype[key] = (...args: any[]) => {
              Socket.invoke(id, args);
            };
            constructor += `rmi.socket.on('${id}', ${func}.bind(this));\n`;
            break;
          case 'server':
            bundle += `${remoteObject.name}['${key}'] = function(...args) {
              return new Promise(async resolve => {
                await rmi.socket.ready;
                rmi.socket.on('${id}', resolve);
                rmi.socket.send('${id}', args);
              });
            }\n\n`;
            Registry.registries[id] = remoteObject[key];
            break;
        }
      }

      bundle = `function ${remoteObject.name}(${args}) {\n${constructor}\n};\n\n` + bundle;

      if (remoteObject.__bundle in Registry.bundles) {
        Registry.bundles[remoteObject.__bundle] += `\n${bundle}`;
      } else {
        Registry.bundles[remoteObject.__bundle] = bundle;
      }
    }
  }
}
