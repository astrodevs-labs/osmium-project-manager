export interface Contextable {
  context: any;
  setContext(context: any): void;
}

type Constructor<T = any> = new (...args: any[]) => T;


export function mixinContextable<T extends Constructor>(base: T): Constructor<Contextable> & T {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    protected context?: any;

    public setContext(context: any) {
      this.context = context;
    }
  };
}