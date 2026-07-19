import { describe, expect, it } from "vitest";
import * as api from "..";
import { COMMANDS, type CommandField, type ValueType } from "../spec.js";
import type { ServerMessage } from "../../pkg/scserver_commands.js";

const EXCEPTIONS: Readonly<Record<string, string>> = {};
const builderName = (address: string) =>
  EXCEPTIONS[address] ??
  address
    .replace(/^\//, "")
    .replace(/\/([a-z])/g, (_, c: string) => c.toUpperCase())
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const builders = api as unknown as Record<string, (...args: any[]) => ServerMessage>;

const primitive = (type: ValueType): unknown => {
  switch (type) {
    case "i32":
      return 2;
    case "f32":
      return 0.5;
    case "string":
      return "x";
    case "controlId":
      return "freq";
    case "numericValue":
      return 0.5;
    case "controlValue":
      return "c2";
    case "oscArg":
      return 0.5;
  }
};
const sample = (field: CommandField): unknown => {
  const form = field.form;
  if (form === "blob" || form === "completion") return Uint8Array.from([1, 2, 3, 4]);
  if (form === "variadic") return [2, 0.5, "x"];
  if ("scalar" in form) return primitive(form.scalar);
  if ("optionScalar" in form) return primitive(form.optionScalar);
  if ("list" in form) return [primitive(form.list)];
  if ("tail" in form) return [form.tail.map(primitive)];
  return [
    [
      primitive(form.setnTail.head),
      [primitive(form.setnTail.values), primitive(form.setnTail.values)],
    ],
  ];
};
const camel = (name: string) => name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const legacyCalls: Record<string, () => ServerMessage> = {
  "/g_new": () => api.gNew(2, 0, 1),
  "/s_new": () => api.sNew("x", 2, 0, 1, [["freq", 0.5]]),
  "/n_set": () => api.nSet(2, { freq: 0.5 }),
  "/n_setn": () => api.nSetn(2, "freq", [0.5]),
  "/n_run": () => api.nRun(2, 1),
  "/n_free": () => api.nFree(2),
  "/g_freeAll": () => api.gFreeAll(2),
  "/d_free": () => api.dFree("x"),
  "/scope/subscribe": () => api.scopeSubscribe({ subId: 2, scope: 2, channels: 2, chunkSize: 2 }),
  "/scope/unsubscribe": () => api.scopeUnsubscribe(2),
  "/dirt/play": () => api.dirtPlay({ s: "x", gain: 0.5 }),
};

function invoke(address: string): ServerMessage {
  const command = COMMANDS.get(address)!;
  if (legacyCalls[address]) return legacyCalls[address]();
  const optional = command.fields.filter(
    (f) => f.form === "completion" || (typeof f.form === "object" && "optionScalar" in f.form),
  );
  const args = command.fields.filter((f) => !optional.includes(f)).map(sample);
  if (optional.length === 1) args.push(sample(optional[0]));
  else if (optional.length > 1)
    args.push(Object.fromEntries(optional.map((f) => [camel(f.name), sample(f)])));
  return builders[builderName(address)](...args);
}

describe("complete spec builder surface", () => {
  it("exports exactly one conventionally named builder per command", () => {
    const names = [...COMMANDS.keys()].map(builderName);
    expect(new Set(names).size).toBe(COMMANDS.size);
    for (const name of names) expect(typeof builders[name]).toBe("function");
  });

  it("matches wasm wire truth and spec-driven describe for every command", () => {
    for (const address of COMMANDS.keys()) {
      const msg = invoke(address);
      expect(msg.address, address).toBe(address);
      const wire = api.flattenEncoded(api.encode(msg))[0];
      // `/b_setn` is also a typed reply address; flattenEncoded intentionally
      // preserves its long-standing lossy reply display (`floats(N)`). Pin
      // that collision separately while describeMessage retains the full tx view.
      if (address === "/b_setn") {
        expect(wire).toEqual({ address, args: [2, 2, "floats(2)"] });
        expect(api.describeMessage(msg)).toEqual({ address, args: ["2", "2", "2", "0.5", "0.5"] });
        continue;
      }
      expect(api.describeMessage(msg), address).toEqual({
        address,
        args: wire.args.map(api.formatOscArg),
      });
    }
  });
});
