/* eslint-disable no-restricted-globals */

import { getLanguage } from "../common.js";

import { checkFile } from "./util.js";

const languageId = "rust";

export default async function rust({ file, lspc }) {
  print(`  ${file.get_path()}`);

  const uri = file.get_uri();
  let version = 0;

  const [contents] = await file.load_contents_async(null);
  const text = new TextDecoder().decode(contents);

  await lspc._notify("textDocument/didOpen", {
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
    lspc,
    file,
    lang: getLanguage(languageId),
    uri,
  });
  if (!checks) return false;

  await lspc._notify("textDocument/didClose", {
    textDocument: {
      uri,
    },
  });
}
