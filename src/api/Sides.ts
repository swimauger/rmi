export class Side {
  static Client(target: any, methodName: string) {
    target[methodName].__side = 'client';
  }
  
  static Server(target: any, methodName: string) {
    target[methodName].__side = 'server';
  }
  
  static Serialized(target: any, methodName: string) {
    target[methodName].__side = 'serialized';
  }
}

