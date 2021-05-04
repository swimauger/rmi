import { ServerRequest } from "https://deno.land/std@0.95.0/http/server.ts";
import { Registry, Side, Bundle } from "../../mod.ts";
// import { Bundle, Registry, Side } from "https://deno.land/x/rmi/mod.ts";

let users: { [username: string]: string };

try {
  users = JSON.parse(await Deno.readTextFile('users.json'));
} catch (error) {
  users = {};
}

class Authentication extends Bundle('auth') {
  @Side.Server
  static async signup(username: string, password: string) {
    try {
      users[username] = password;
      await Deno.writeTextFile('users.json', JSON.stringify(users));
      return true;
    } catch (error) {
      return false;
    }
  }
}

Registry.registerRemoteObject(Authentication);

Registry.registerRoute({
  method: 'get',
  path: '/',
  response: async function(req: ServerRequest) {
    req.respond({
      body: await Deno.readFile('auth.html')
    });
  }
});

Registry.createServer(8080);
console.log('Listening on port', 8080);
