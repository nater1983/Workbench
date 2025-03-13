/* eslint-disable no-restricted-globals */

import { getLanguage } from "../common.js";
import { checkFile, diagnose } from "./util.js";

const languageId = "css";

export default async function css({ file, lspc }) {
  print(`  ${file.get_path()}`);

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
