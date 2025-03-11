/* eslint-disable no-restricted-globals */

import Gio from "gi://Gio";

import { getLanguage } from "../common.js";
import { waitForDiagnostics } from "./lint.js";
import { serializeDiagnostics, checkFile } from "./util.js";

export default async function vala({ file_vala, lsp_clients, demo_dir }) {
  print(`  ${file_vala.get_path()}`);

  const uri = file_vala.get_uri();
  const languageId = "vala";
  let version = 0;

  const file_api = Gio.File.new_for_path(pkg.pkgdatadir).get_child(
    "workbench.vala",
  );
  file_api.copy(
    demo_dir.get_child("workbench.vala"),
    Gio.FileCopyFlags.OVERWRITE,
    null,
    null,
  );

  const [contents] = await file_vala.load_contents_async(null);
  const text = new TextDecoder().decode(contents);

  await lsp_clients.vala._notify("textDocument/didOpen", {
    textDocument: {
      uri,
      languageId,
      version: version++,
      text,
    },
  });

  let diagnostics = await waitForDiagnostics({
    uri,
    lspc: lsp_clients.vala,
  });
  // FIXME: deprecated features, no replacement?
  if (demo_dir.get_basename() === "Text Fields") {
    const ignore_for_text_fields = [
      "`Gtk.EntryCompletion' has been deprecated since 4.10",
      "`Gtk.Entry.completion' has been deprecated since 4.10",
      "`Gtk.ListStore' has been deprecated since 4.10",
      "`Gtk.TreeIter' has been deprecated since 4.10",
    ];
    diagnostics = diagnostics.filter((diagnostic) => {
      return !ignore_for_text_fields.includes(diagnostic.message);
    });
    // Gtk.StyleContext class is deprecated but not the following methods
    // gtk_style_context_add_provider_for_display
    // gtk_style_context_remove_provider_for_display
  } else if (demo_dir.get_basename() === "CSS Gradients") {
    diagnostics = diagnostics.filter((diagnostic) => {
      return (
        diagnostic.message !==
        "`Gtk.StyleContext' has been deprecated since 4.10"
      );
    });
  }

  if (diagnostics.length > 0) {
    printerr(serializeDiagnostics({ diagnostics }));
    return false;
  }
  print(`  ✅ lints`);

  const checks = await checkFile({
    lspc: lsp_clients.vala,
    file: file_vala,
    lang: getLanguage("vala"),
    uri,
  });
  if (!checks) return false;

  await lsp_clients.vala._notify("textDocument/didClose", {
    textDocument: {
      uri,
    },
  });
}
