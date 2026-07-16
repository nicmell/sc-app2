import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  buildPluginZip,
  isValidPluginName,
  isValidPluginVersion,
  validateMetadata,
  type PluginMetadata,
} from "../buildPluginZip";

const metadata: PluginMetadata = {
  name: "test-plugin",
  version: "1.2.3",
  author: "Test Author",
  title: "Test Plugin",
  description: "A test plugin",
  entry: "index.html",
  assets: [],
};

describe("buildPluginZip", () => {
  it("roundtrips metadata and entry content", () => {
    const entryXml = "<sc-plugin><sc-text>héllo</sc-text></sc-plugin>";
    const files = unzipSync(buildPluginZip(metadata, entryXml));

    expect(JSON.parse(strFromU8(files["metadata.json"]))).toEqual(metadata);
    expect(files[metadata.entry]).toEqual(new TextEncoder().encode(entryXml));
  });

  it("omits a blank title from metadata.json", () => {
    const files = unzipSync(buildPluginZip({ ...metadata, title: "  " }, "<sc-plugin />"));

    expect(JSON.parse(strFromU8(files["metadata.json"]))).not.toHaveProperty("title");
  });

  it("respects a custom entry filename", () => {
    const entry = "ui/plugin.xhtml";
    const files = unzipSync(buildPluginZip({ ...metadata, entry }, "<sc-plugin />"));

    expect(files[entry]).toBeDefined();
    expect(files["index.html"]).toBeUndefined();
  });
});

describe("metadata validation", () => {
  it("rejects names with invalid characters", () => {
    expect(isValidPluginName("bad name")).toBe(false);
    expect(validateMetadata({ ...metadata, name: "bad name" })).toHaveProperty("name");
  });

  it.each(["1.2", "1.2.x"])("rejects invalid version %s", (version) => {
    expect(isValidPluginVersion(version)).toBe(false);
    expect(validateMetadata({ ...metadata, version })).toHaveProperty("version");
  });

  it("rejects an author that is blank after trimming", () => {
    expect(validateMetadata({ ...metadata, author: "  " })).toHaveProperty("author");
  });
});
