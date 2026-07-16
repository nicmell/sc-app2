import type { ProtocolPort } from "@/lib/osc/protocol/port";
export function createLoopbackPair(): [ProtocolPort, ProtocolPort] {
  let left: (msg: unknown) => void = () => {};
  let right: (msg: unknown) => void = () => {};
  return [
    {
      postMessage: (msg) => right(msg),
      onMessage: (cb) => {
        left = cb;
      },
    },
    {
      postMessage: (msg) => left(msg),
      onMessage: (cb) => {
        right = cb;
      },
    },
  ];
}
