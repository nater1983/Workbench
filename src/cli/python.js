/* eslint-disable no-restricted-globals */

import { PYTHON_LSP_CONFIG, getLanguage } from "../common.js";

import { checkFile, diagnose } from "./util.js";

const languageId = "python";

export default async function python({ file, lspc }) {
  print(`  ${file.get_path()}`);

  await lspc._request("workspace/didChangeConfiguration", {
    settings: PYTHON_LSP_CONFIG,
  });

  const text = await diagnose({ file, lspc, languageId });
  if (text === false) return false;

  const checks = await checkFile({
    lspc,
    file,
    lang: getLanguage(languageId),
    uri: file.get_uri(),
  });
  if (!checks) return false;

  await lspc._notify("textDocument/didClose", {
    textDocument: {
      uri: file.get_uri(),
    },
  });
}
