export default class Dispatcher {
  constructor() {
    this.resolvers = {};
    this.listeners = {};
  }

  notify(key, args = []) {
    if (key in this.listeners) {
      const listeners = this.listeners[key];
      for (const handler of listeners)
        handler(...args);
    }

    if (key in this.resolvers) {
      const resolvers = this.resolvers[key];
      delete this.resolvers[key];
      for (const [resolve, unwrap] of resolvers) {
        const params = unwrap && args.length === 1 ? args[0] : args;
        resolve(params);
      }
    }
  }

  wait(key, unwrap = true) {
    return new Promise((resolve) => {
      if (!(key in this.resolvers)) this.resolvers[key] = [[resolve, unwrap]];
      else this.resolvers[key].push([resolve, unwrap]);
    });
  }

  waitFor(key, condition) {
    return new Promise((resolve) => {
      const wrappedResolve = (...args) => {
        if (condition(...args))
          resolve(...args);
      };

      if (!(key in this.resolvers)) this.resolvers[key] = [[wrappedResolve]];
      else this.resolvers[key].push([wrappedResolve]);
    });
  }

  on(key, handler) {
    if (!(key in this.listeners)) this.listeners[key] = [handler];
    else this.listeners[key].push(handler);

    return () => this.off(key, handler);
  }

  off(key, handler) {
    if (key in this.listeners) {
      this.listeners[key].splice(this.listeners[key].indexOf(handler), 1);

      if (this.listeners[key].length === 0)
        delete this.listeners[key];
    }
  }
}
