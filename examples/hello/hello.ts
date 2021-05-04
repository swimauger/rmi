import { ServerRequest } from "https://deno.land/std@0.95.0/http/server.ts";
import { Registry, Side, Bundle } from "../../mod.ts";

// Creating a Remote Object
class HelloService extends Bundle('hello') {
  @Side.Serialized
  runOnClientFromClient() {
    alert('Hello client from client');
  }

  @Side.Client
  static runOnClientsFromServer() {
    console.log('Hello clients from server');
  }

  @Side.Server
  static runOnServerFromClient(id: number) {
    console.log(`Client with id ${id} says hello server`);
  }

  runOnServerFromServer() {
    console.log('Hello server from server');
  }
}

// Registering the Remote Object to bundle
Registry.registerRemoteObject(HelloService);

// Create route to html file containing RMI bundle and executions
Registry.registerRoute({
  method: 'get',
  path: '/',
  response: async function(req: ServerRequest) {
    req.respond({
      body: await Deno.readTextFile('hello.html')
    });
  }
});

console.log('Server listening on port', 8080);
Registry.createServer(8080);
