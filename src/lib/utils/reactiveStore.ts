/**
 * Tiny observable used throughout the app. No framework dependency — plain
 * callbacks with an unsubscribe function.
 *
 *     const s = createStore(0);
 *     const off = s.subscribe(v => console.log(v));
 *     s.set(1);      // logs 1
 *     off();
 *
 * The whole app shares ONE root store (see `src/state/store.ts`); every domain
 * reads/writes a slice of it. Two derivations make that ergonomic:
 *
 *   • `select(fn)` — a read-only view that notifies only when the selected value
 *     changes (`Object.is`). Used for the React hooks.
 *   • `slice(key)` — a writable view onto one top-level key, backed by the parent.
 *
 * Correctness rests on **immutable, sibling-preserving updates**: writing one
 * slice via `{ ...s, [key]: next }` keeps the other slices referentially stable,
 * so a `session` change never notifies a `layout` subscriber, and `getSnapshot`
 * stays stable for `useSyncExternalStore`.
 */

// The members are declared as arrow-property types, not method signatures, on
// purpose: `get`/`subscribe` are routinely detached and passed to
// `useSyncExternalStore(store.subscribe, store.get)`, and they close over their
// state (no `this`). The property-type form documents that and keeps the
// type-aware `unbound-method` lint from flagging every such call.
export interface ReadonlyStore<T> {
  get: () => T;
  subscribe: (cb: (value: T) => void) => () => void;
  /** A derived read-only view; notifies only when the selected value changes. */
  select: <U>(selector: (value: T) => U) => ReadonlyStore<U>;
}

export interface Store<T> extends ReadonlyStore<T> {
  set: (value: T) => void;
  update: (fn: (prev: T) => T) => void;
  /** A writable view onto one top-level key, backed by this store. */
  slice: <K extends keyof T>(key: K) => Store<T[K]>;
}

/** Read-only view that re-derives `selector(parent)` and fires only on change. */
function makeSelect<T, U>(parent: ReadonlyStore<T>, selector: (value: T) => U): ReadonlyStore<U> {
  const get = () => selector(parent.get());
  const self: ReadonlyStore<U> = {
    get,
    subscribe(cb) {
      let last = get();
      return parent.subscribe(() => {
        const next = get();
        if (!Object.is(last, next)) {
          last = next;
          cb(next);
        }
      });
    },
    select(sel) {
      return makeSelect(self, sel);
    },
  };
  return self;
}

/** Writable view onto `parent[key]`, sharing the parent's subscription. */
function makeSlice<T, K extends keyof T>(parent: Store<T>, key: K): Store<T[K]> {
  const view = makeSelect(parent, (s) => s[key]);
  const self: Store<T[K]> = {
    get: view.get,
    subscribe: view.subscribe,
    select: view.select,
    set(next) {
      parent.update((s) => (Object.is(s[key], next) ? s : { ...s, [key]: next }));
    },
    update(fn) {
      self.set(fn(self.get()));
    },
    slice(k) {
      return makeSlice(self, k);
    },
  };
  return self;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const subs = new Set<(v: T) => void>();

  const store: Store<T> = {
    get: () => value,
    set(next) {
      if (Object.is(value, next)) return;
      value = next;
      // Snapshot so a subscriber that unsubscribes mid-notify is safe.
      for (const cb of [...subs]) cb(value);
    },
    update(fn) {
      store.set(fn(value));
    },
    subscribe(cb) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    select(selector) {
      return makeSelect(store, selector);
    },
    slice(key) {
      return makeSlice(store, key);
    },
  };
  return store;
}
