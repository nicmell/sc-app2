export class MessageDispatcher<T extends { type: string }> {
  private handlers = new Map<T["type"], (msg: T) => void>();
  register<K extends T["type"]>(type: K, handler: (msg: Extract<T, { type: K }>) => void): void {
    this.handlers.set(type, handler as (msg: T) => void);
  }
  dispatch(msg: T): void {
    this.handlers.get(msg.type)?.(msg);
  }
}
