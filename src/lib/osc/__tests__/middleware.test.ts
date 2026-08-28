import { describe, expect, it, vi } from "vitest";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { composeDispatch } from "../middleware";

describe("composeDispatch", () => {
  it("composes stages in order", () => {
    const seen: string[] = [];
    const dispatch = composeDispatch<TransportCommand>(
      [
        (command, next) => {
          seen.push("a-in");
          next(command);
          seen.push("a-out");
        },
        (command, next) => {
          seen.push("b");
          next(command);
        },
      ],
      () => seen.push("terminal"),
    );
    dispatch({ type: "leave" });
    expect(seen).toEqual(["a-in", "b", "terminal", "a-out"]);
  });

  it("allows osc filtering by skipping next", () => {
    const terminal = vi.fn();
    composeDispatch<TransportCommand>(
      [() => {}],
      terminal,
    )({
      type: "osc",
      packet: { address: "/drop", args: [] },
    });
    expect(terminal).not.toHaveBeenCalled();
  });

  it("force-propagates lifecycle payloads", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const terminal = vi.fn();
    composeDispatch<TransportEvent>([() => {}], terminal)({ type: "respawn" });
    expect(warn).toHaveBeenCalledOnce();
    expect(terminal).toHaveBeenCalledWith({ type: "respawn" });
  });

  it("isolates a throwing stage and guarantees the terminal", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const terminal = vi.fn();
    composeDispatch<TransportEvent>(
      [
        () => {
          throw new Error("boom");
        },
      ],
      terminal,
    )({ type: "open" });
    expect(terminal).toHaveBeenCalledWith({ type: "open" });
  });

  it("uses per-dispatch closures when one chain re-enters another", () => {
    const seen: string[] = [];
    const commandDispatch = composeDispatch<TransportCommand>(
      [
        (command, next) => {
          seen.push("command-stage");
          next(command);
        },
      ],
      () => seen.push("command-terminal"),
    );
    const eventDispatch = composeDispatch<TransportEvent>(
      [
        (event, next) => {
          seen.push("event-in");
          commandDispatch({ type: "leave" });
          next(event);
          seen.push("event-out");
        },
      ],
      () => seen.push("event-terminal"),
    );
    eventDispatch({ type: "open" });
    expect(seen).toEqual([
      "event-in",
      "command-stage",
      "command-terminal",
      "event-terminal",
      "event-out",
    ]);
  });
});
