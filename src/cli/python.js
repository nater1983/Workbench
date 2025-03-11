/* eslint-disable no-restricted-globals */

import { PYTHON_LSP_CONFIG, getLanguage } from "../common.js";

import { waitForDiagnostics } from "./lint.js";
import { serializeDiagnostics, checkFile } from "./util.js";

export default async function python({ file_python, lsp_clients }) {
  print(`  ${file_python.get_path()}`);

  const uri = file_python.get_uri();
  const languageId = "python";
  let version = 0;

  const [contents] = await file_python.load_contents_async(null);
  const text = new TextDecoder().decode(contents);

  await lsp_clients.python._request("workspace/didChangeConfiguration", {
    settings: PYTHON_LSP_CONFIG,
  });

  await lsp_clients.python._notify("textDocument/didOpen", {
    textDocument: {
      uri,
      languageId,
      version: version++,
      text,
    },
  });

  const diagnostics = await waitForDiagnostics({
    uri,
    lspc: lsp_clients.python,
  });
  if (diagnostics.length > 0) {
    printerr(serializeDiagnostics({ diagnostics }));
    return false;
  }
  print(`  ✅ lints`);

  const checks = await checkFile({
    lspc: lsp_clients.python,
    file: file_python,
    lang: getLanguage("python"),
    uri,
  });
  if (!checks) return false;

  await lsp_clients.python._notify("textDocument/didClose", {
    textDocument: {
      uri,
    },
  });
}
