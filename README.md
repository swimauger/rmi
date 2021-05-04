# RMI Deno Package

<img align="right" width="175vw" src="./deno.svg">

![](https://img.shields.io/badge/available%20on-deno.land/x-6B3E2E.svg?logo=deno&labelColor=555555&style=for-the-badge)
![](https://img.shields.io/github/v/release/swimauger/rmi.svg?color=C38452&style=for-the-badge)
![](https://img.shields.io/github/repo-size/swimauger/rmi?color=A1785C&label=Size&style=for-the-badge)
![](https://img.shields.io/github/license/swimauger/rmi?color=CCB494&style=for-the-badge)

## Remote Method Invocation in TypeScript for Deno Compiler

> Remote Method Invocation (RMI) is an architecture in which Server Side methods are exposed directly to the client and called on the server. Eliminating the repetitive process of programming the same API on both the client and  server.


## **Getting Started**
```javascript
  import { Registry, Side, Bundle } from "https://deno.land/x/rmi/mod.ts";
```

<br>

## **Creating and Registering a Remote Object and Route**
### *On the server:*
```typescript
  // Create a Remote Object for the "login" bundle
  class Authentication extends Bundle('login') {
    static init() {
      // Initialize database with key
    }

    @Side.Server
    static signup(username: string, password: string) {
      return someToken;
    }
  }

  Authentication.init();

  // Register Remote Object
  Registry.registerRemoteObject(Authentication);

  // Register a new route
  Registry.registerRoute({
    path: '/',
    method: 'get',
    response: function(req: ServerRequest) {
      req.respond({
        body: Deno.readFileSync('page.html')
      });
    }
  });

  // Start Server on port 8080
  Registry.createServer(8080);
```

### *On the client:*
```html
  <!-- Load the login bundle in a script -->
  <script src="/rmi/login"></script>

  <!-- Use the remote object API on the client -->
  <script>
    (async () => {
      const token = await Authentication.signup('johndoe', 'password123');
    })();
  </script>

  <!-- That's it!!! -->
```

## Scoping your Remote Object

### Bundle Scoping:
```typescript
  class Authentication extends Bundle('login')
```
- **Bundle Scoping allows the developer to Bundle multiple remote objects into a single script file**
- In the previous server example on the first line, you can see the Authentication remote object can be accessed in the login bundle.

### Side Scoping:
```typescript
  @Side.Server
  invokedOnServerCalledFromClient()

  @Side.Client
  invokedOnClientCalledFromServer()

  @Side.Serialized
  invokedOnClientCalledFromClient()

  // No Decorator
  invokedOnServerCalledFromServer()
```
- **Side Scoping is how you want methods to be invoked**
- Side.Server turns the function on the client to a request to the server
  - Used for logic you want to be called on the server from the client
- Side.Client turns the function on the client into an event listener for calls from the server
  - Used for logic you want to be called on the client from the server
- Side.Serialized keeps the exact same function on the client
  - Used for logic you want to use directly on the client
- No Decorator keeps the exact same function ONLY on the server
  - Used for logic you dont want to be accessible at all by the client
