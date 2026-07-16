import { strToU8, zipSync } from "fflate";
import type { PluginAsset, PluginInfo } from "@/types/api";

export interface PluginMetadata extends Omit<PluginInfo, "id" | "assets"> {
  assets: PluginAsset[];
}

export const DEFAULT_ENTRY_FILE = "index.html";

export function buildPluginZip(meta: PluginMetadata, entryXml: string): Uint8Array {
  const metadata: PluginMetadata = { ...meta };
  if (!metadata.title?.trim()) delete metadata.title;
  if (!metadata.description?.trim()) delete metadata.description;

  return zipSync({
    "metadata.json": strToU8(JSON.stringify(metadata, null, 2)),
    [meta.entry]: strToU8(entryXml),
  });
}

export function isValidPluginName(name: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(name);
}

export function isValidPluginVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export function validateMetadata(
  meta: PluginMetadata,
): Partial<Record<"name" | "version" | "author", string>> {
  const errors: Partial<Record<"name" | "version" | "author", string>> = {};

  if (!meta.name.trim()) errors.name = "Name is required";
  else if (!isValidPluginName(meta.name.trim()))
    errors.name = "Name must only contain A-Z, a-z, 0-9, - or _";

  if (!meta.version.trim()) errors.version = "Version is required";
  else if (!isValidPluginVersion(meta.version.trim()))
    errors.version = "Version must be in the form major.minor.patch";

  if (!meta.author.trim()) errors.author = "Author is required";

  return errors;
}
