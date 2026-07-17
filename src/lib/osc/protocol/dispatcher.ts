// The one router both sides of the worker port use: the proxy registers
// OscEvent handlers, the endpoint OscRequest/OscCommand handlers — same
// class, discriminated on the message's `type` tag. Unknown types are
// silently ignored (a stray message must not throw inside the port's
// global handler).

export class MessageDispatcher<T extends { type: string }> {
  private handlers = new Map<T["type"], (msg: T) => void>();

  /** Register the handler for one message type — `Extract` narrows the
   *  handler's parameter, the cast erases it for the untyped map. */
  register<K extends T["type"]>(type: K, handler: (msg: Extract<T, { type: K }>) => void): void {
    this.handlers.set(type, handler as (msg: T) => void);
  }

  dispatch(msg: T): void {
    this.handlers.get(msg.type)?.(msg);
  }
}
