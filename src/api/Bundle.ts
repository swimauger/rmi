export function Bundle(name: string) {
  // Potentially add default bundle main, so maybe throw if they use name 'main'
  return class {
    public static __bundle: string = name;
  }
}