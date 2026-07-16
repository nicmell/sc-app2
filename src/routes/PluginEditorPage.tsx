import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePath, useBlocker, useNavigate, useParams } from "react-router";
import { PluginEditor } from "@/components/PluginEditor";
import { Alert, Button, Flex, Input, Progress, Textarea } from "@/components/ui";
import { Modal, modalStyles } from "@/components/ui/Modal";
import { ROUTES } from "@/constants/routes";
import { EditorController } from "@/lib/editor/EditorController";
import { createElement } from "@/lib/editor/model";
import { serializeEntry } from "@/lib/editor/serialize";
import { get, HttpError } from "@/lib/http";
import {
  DEFAULT_ENTRY_FILE,
  type PluginMetadata,
  validateMetadata,
} from "@/lib/plugins/buildPluginZip";
import { createPlugin, plugins, updatePlugin } from "@/stores/plugins";
import { useStore } from "@/stores/useStore";
import type { PluginInfo } from "@/types/api";
import styles from "./PluginEditorPage.module.scss";

const EMPTY_ENTRY_XML = serializeEntry(createElement("sc-plugin"));

type MetadataField = "name" | "version" | "author" | "title" | "description";

function metadataFromInfo(info?: PluginInfo): PluginMetadata {
  return {
    name: info?.name ?? "",
    version: info?.version ?? "0.1.0",
    author: info?.author ?? "",
    title: info?.title ?? "",
    description: info?.description ?? "",
    entry: info?.entry ?? DEFAULT_ENTRY_FILE,
    assets: info?.assets ?? [],
  };
}

interface MetadataPanelProps {
  metadata: PluginMetadata;
  errors: ReturnType<typeof validateMetadata>;
  onChange: (field: MetadataField, value: string) => void;
}

function MetadataPanel({ metadata, errors, onChange }: MetadataPanelProps) {
  const input = (field: MetadataField) => (event: Event) =>
    onChange(field, (event.currentTarget as HTMLInputElement).value);

  return (
    <section className={styles.metadataPanel} aria-labelledby="metadata-heading">
      <h2 id="metadata-heading">Metadata</h2>
      <label>
        <span>Name</span>
        <Input name="name" value={metadata.name} onInput={input("name")} />
        {errors.name && <small className={styles.fieldError}>{errors.name}</small>}
      </label>
      <label>
        <span>Version</span>
        <Input name="version" value={metadata.version} onInput={input("version")} />
        {errors.version && <small className={styles.fieldError}>{errors.version}</small>}
      </label>
      <label>
        <span>Author</span>
        <Input name="author" value={metadata.author} onInput={input("author")} />
        {errors.author && <small className={styles.fieldError}>{errors.author}</small>}
      </label>
      <label>
        <span>Title</span>
        <Input name="title" value={metadata.title ?? ""} onInput={input("title")} />
      </label>
      <label>
        <span>Description</span>
        <Textarea
          name="description"
          value={metadata.description ?? ""}
          onInput={input("description")}
        />
      </label>
    </section>
  );
}

export function PluginEditorPage() {
  const { sessionId: matchedSessionId, pluginId } = useParams();
  const sessionId = matchedSessionId!;
  const mode = pluginId ? "edit" : "new";
  const navigate = useNavigate();
  const info = useStore(plugins).find((plugin) => plugin.id === pluginId);
  const [metadata, setMetadata] = useState<PluginMetadata>(() => metadataFromInfo(info));
  const [entryXml, setEntryXml] = useState<string | null>(mode === "new" ? EMPTY_ENTRY_XML : null);
  const [controller, setController] = useState<EditorController | null>(null);
  const [entryRevision, setEntryRevision] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    metadata: metadataFromInfo(info),
    xml: mode === "new" ? EMPTY_ENTRY_XML : "",
  }));
  const [loadError, setLoadError] = useState<{ pluginId: string; message: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const allowNavigation = useRef(false);

  useEffect(() => {
    allowNavigation.current = false;
  }, [pluginId]);

  useEffect(() => {
    if (!pluginId || !info) return;
    let active = true;
    void get(`/api/plugins/${pluginId}/${info.entry}`, { cache: "no-store" })
      .then((response) => response.text())
      .then((xml) => {
        if (!active) return;
        const nextMetadata = metadataFromInfo(info);
        setController(null);
        setMetadata(nextMetadata);
        setSavedSnapshot({ metadata: nextMetadata, xml });
        setEntryXml(xml);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError({
            pluginId,
            message: error instanceof Error ? error.message : "Unable to load plugin",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [info, pluginId]);

  const metadataErrors = useMemo(() => validateMetadata(metadata), [metadata]);
  const valid = Object.keys(metadataErrors).length === 0;
  const currentXml = controller?.serialize() ?? entryXml ?? "";
  const dirty =
    JSON.stringify(metadata) !== JSON.stringify(savedSnapshot.metadata) ||
    currentXml !== savedSnapshot.xml;

  const shouldBlock = useCallback(() => dirty && !allowNavigation.current, [dirty]);
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const handleController = useCallback((nextController: EditorController) => {
    setController(nextController);
  }, []);

  const handleEntryDirty = useCallback(() => {
    setEntryRevision((revision) => revision + 1);
  }, []);
  void entryRevision;

  const goBack = () => {
    void navigate(generatePath(ROUTES.SESSION, { sessionId }));
  };

  const handleMetadataChange = (field: MetadataField, value: string) => {
    setMetadata((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!controller || !valid || !dirty || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      const xml = controller.serialize();
      if (mode === "new") {
        const created = await createPlugin(metadata, xml);
        allowNavigation.current = true;
        void navigate(
          generatePath(ROUTES.SESSION_PLUGIN_EDIT, { sessionId, pluginId: created.id }),
          { replace: true },
        );
      } else if (pluginId) {
        await updatePlugin(pluginId, metadata, xml);
        setSavedSnapshot({ metadata, xml });
      }
    } catch (error) {
      setSaveError(error instanceof HttpError ? error.message : "Unable to save plugin");
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit" && !info) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <Button variant="ghost" size="sm" icon="arrow-left" label="Back" onClick={goBack} />
          <h1>Plugin not found</h1>
        </header>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Button variant="ghost" size="sm" icon="arrow-left" label="Back" onClick={goBack} />
        <h1>{mode === "new" ? "New plugin" : (info?.title ?? info?.name)}</h1>
        <Button
          className={styles.saveButton}
          variant="primary"
          label={saving ? "Saving…" : "Save"}
          disabled={!valid || !dirty || !controller || saving}
          onClick={() => void handleSave()}
        />
      </header>
      {saveError && (
        <Alert className={styles.errorAlert} variant="error">
          {saveError}
        </Alert>
      )}
      <div className={styles.content}>
        <MetadataPanel
          metadata={metadata}
          errors={metadataErrors}
          onChange={handleMetadataChange}
        />
        <div className={styles.editorArea}>
          {mode === "edit" && entryXml === null && loadError?.pluginId !== pluginId && (
            <div className={styles.loading}>
              <Progress variant="spinner" label="Loading plugin entry" />
            </div>
          )}
          {loadError != null && loadError.pluginId === pluginId && (
            <Alert className={styles.errorAlert} variant="error">
              {loadError.message}
            </Alert>
          )}
          {entryXml !== null && (
            <PluginEditor
              key={pluginId ?? "new"}
              initialXml={entryXml}
              controllerRef={handleController}
              onDirtyChange={handleEntryDirty}
            />
          )}
        </div>
      </div>
      {blocker.state === "blocked" && (
        <Modal label="Discard unsaved changes?">
          <h2 className={modalStyles.title}>Discard unsaved changes?</h2>
          <p className={modalStyles.body}>Your changes will be lost if you leave this page.</p>
          <Flex wrap align="center" gap="xs" className={modalStyles.actions}>
            <Button variant="ghost" label="Keep editing" onClick={() => blocker.reset()} />
            <Button variant="primary" label="Discard" onClick={() => blocker.proceed()} />
          </Flex>
        </Modal>
      )}
    </main>
  );
}
