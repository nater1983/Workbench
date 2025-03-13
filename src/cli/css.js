/* eslint-disable no-restricted-globals */

import { getLanguage } from "../common.js";
import { checkFile, diagnose } from "./util.js";

const languageId = "css";

export default async function css({ file, lspc }) {
  print(`  ${file.get_path()}`);

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
