/* eslint-disable no-restricted-globals */

import { PYTHON_LSP_CONFIG, getLanguage } from "../common.js";

import { checkFile, diagnose } from "./util.js";

const languageId = "python";

export default async function python({ file, lspc }) {
  print(`  ${file.get_path()}`);

  await lspc._request("workspace/didChangeConfiguration", {
    settings: PYTHON_LSP_CONFIG,
  });

  await diagnose({ file, lspc, languageId });

  await checkFile({
    lspc,
    file,
    lang: getLanguage(languageId),
    uri: file.get_uri(),
  });

  await lspc._notify("textDocument/didClose", {
    textDocument: {
      uri: file.get_uri(),
    },
  });
}
