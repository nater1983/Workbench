/* eslint-disable no-restricted-globals */

import { getLanguage } from "../common.js";
import { waitForDiagnostics } from "./lint.js";
import { serializeDiagnostics, checkFile, getCodeObjectIds } from "./util.js";

export default async function typescript({
  file_javascript,
  lsp_clients,
  blueprint_object_ids,
  demo_dir,
  application,
  builder,
  template,
  window,
}) {
  print(`  ${file_javascript.get_path()}`);

  const uri = file_javascript.get_uri();
  const languageId = "javascript";
  let version = 0;

  const [contents] = await file_javascript.load_contents_async(null);
  const text = new TextDecoder().decode(contents);

  await lsp_clients.javascript._notify("textDocument/didOpen", {
    textDocument: {
      uri,
      languageId,
      version: version++,
      text,
    },
  });

  const diagnostics = await waitForDiagnostics({
    uri,
    lspc: lsp_clients.javascript,
  });
  if (diagnostics.length > 0) {
    printerr(serializeDiagnostics({ diagnostics }));
    return false;
  }
  print(`  ✅ lints`);

  const checks = await checkFile({
    lspc: lsp_clients.javascript,
    file: file_javascript,
    lang: getLanguage("javascript"),
    uri,
  });
  if (!checks) return false;

  const js_object_ids = getCodeObjectIds(text);
  for (const object_id of js_object_ids) {
    if (!blueprint_object_ids.includes(object_id)) {
      print(`  ❌ Reference to inexistant object id "${object_id}"`);
      return false;
    }
  }

  globalThis.workbench = {
    window,
    application,
    builder,
    template,
    resolve(path) {
      return demo_dir.resolve_relative_path(path).get_uri();
    },
    preview() {},
  };

  await import(`file://${file_javascript.get_path()}`);
  print("  ✅ runs");

  await lsp_clients.javascript._notify("textDocument/didClose", {
    textDocument: {
      uri,
    },
  });
}
