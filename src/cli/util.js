/* eslint-disable no-restricted-globals */

import Gtk from "gi://Gtk";

import { diagnostic_severities } from "../lsp/LSP.js";
import { formatting } from "./format.js";

export function serializeDiagnostics({ diagnostics }) {
  return (
    diagnostics
      .map(({ severity, range, message }) => {
        return (
          "  ❌ " +
          diagnostic_severities[severity] +
          "  " +
          range.start.line +
          ":" +
          range.start.character +
          "  " +
          message.split("\n")[0]
        );
      })
      .join("\n") + "\n"
  );
}

export async function checkFile({ lspc, file, lang, uri }) {
  const [contents] = await file.load_contents_async(null);
  const text = new TextDecoder().decode(contents);
  const buffer = new Gtk.TextBuffer({ text });

  const buffer_tmp = new Gtk.TextBuffer({ text: buffer.text });
  await formatting({ buffer: buffer_tmp, uri, lang, lspc });

  if (buffer_tmp.text === buffer.text) {
    print(`  ✅ checks`);
    return true;
  } else {
    printerr(
      `  ❌ formatting differs - open and run ${file
        .get_parent()
        .get_basename()} with Workbench to fix`,
    );
    return false;
  }
}

export function getCodeObjectIds(text) {
  const object_ids = [];
  for (const match of text.matchAll(/get_object\("(.+)"\)/g)) {
    object_ids.push(match[1]);
  }
  return object_ids;
}
