/* eslint-disable no-restricted-globals */

import { getLanguage } from "../common.js";

import { checkFile } from "./util.js";

export default async function rust({ file_rust, lsp_clients }) {
  print(`  ${file_rust.get_path()}`);

  const uri = file_rust.get_uri();
  const languageId = "rust";
  let version = 0;

  const [contents] = await file_rust.load_contents_async(null);
  const text = new TextDecoder().decode(contents);

  await lsp_clients.rust._notify("textDocument/didOpen", {
    textDocument: {
      uri,
      languageId,
      version: version++,
      text,
    },
  });

  // FIXME: rust analyzer doesn't publish diagnostics if there are none
  // probably we should switch to pulling diagnostics but unknown if supported
  // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#textDocument_pullDiagnostics

  // const diagnostics = await waitForDiagnostics({
  //   uri,
  //   lspc: lsp_clients.rust,
  // });
  // if (diagnostics.length > 0) {
  //   printerr(serializeDiagnostics({ diagnostics }));
  //   return false;
  // }
  // print(`  ✅ lints`);

  const checks = await checkFile({
    lspc: lsp_clients.rust,
    file: file_rust,
    lang: getLanguage("rust"),
    uri,
  });
  if (!checks) return false;

  await lsp_clients.rust._notify("textDocument/didClose", {
    textDocument: {
      uri,
    },
  });
}
