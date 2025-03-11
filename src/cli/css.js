/* eslint-disable no-restricted-globals */

import { getLanguage } from "../common.js";
import { waitForDiagnostics } from "./lint.js";
import { serializeDiagnostics, checkFile } from "./util.js";

export default async function css({ file_css, lsp_clients }) {
  print(`  ${file_css.get_path()}`);

  const uri = file_css.get_uri();
  const languageId = "css";
  let version = 0;

  const [contents] = await file_css.load_contents_async(null);
  const text = new TextDecoder().decode(contents);

  await lsp_clients.css._notify("textDocument/didOpen", {
    textDocument: {
      uri,
      languageId,
      version: version++,
      text,
    },
  });

  const diagnostics = await waitForDiagnostics({
    uri,
    lspc: lsp_clients.css,
  });
  if (diagnostics.length > 0) {
    printerr(serializeDiagnostics({ diagnostics }));
    return false;
  }
  print(`  ✅ lints`);

  const checks = await checkFile({
    lspc: lsp_clients.css,
    file: file_css,
    lang: getLanguage("css"),
    uri,
  });
  if (!checks) return false;

  await lsp_clients.css._notify("textDocument/didClose", {
    textDocument: {
      uri,
    },
  });
}
