/* eslint-disable no-restricted-globals */

import Gtk from "gi://Gtk";

import { getLanguage } from "../common.js";
import { parse } from "../langs/xml/xml.js";
import { LSPError } from "../lsp/LSP.js";
import { checkFile, diagnose } from "./util.js";

const languageId = "blueprint";

export default async function blueprint({ file, lspc }) {
  print(`  ${file.get_path()}`);

  const text = await diagnose({
    file,
    lspc,
    languageId,
    filter(diagnostic) {
      // No replacements yet
      return ![
        "Gtk.ShortcutsShortcut is deprecated\nhint: This widget will be removed in GTK 5",
        "Gtk.ShortcutLabel is deprecated\nhint: This widget will be removed in GTK 5",
      ].includes(diagnostic.message);
    },
  });
  if (text === false) return false;

  const { xml } = await lspc._request("textDocument/x-blueprint-compile", {
    textDocument: {
      uri: file.get_uri(),
    },
  });

  print(`  ✅ compiles`);

  try {
    await lspc._request("x-blueprint/decompile", {
      text: xml,
    });
    print("  ✅ decompiles");
  } catch (err) {
    if (!(err instanceof LSPError)) throw err;
    if (
      ![
        // https://gitlab.gnome.org/jwestman/blueprint-compiler/-/issues/128
        "unsupported XML tag: <condition>",
        // https://gitlab.gnome.org/jwestman/blueprint-compiler/-/issues/139
        "unsupported XML tag: <items>",
      ].includes(err.message)
    ) {
      throw err;
    }
  }

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

  const tree = parse(xml);
  const template_el = tree.getChild("template");

  let template;
  const builder = new Gtk.Builder();
  const blueprint_object_ids = [];

  if (template_el) {
    template = tree.toString();
  } else {
    builder.add_from_string(xml, -1);
    print(`  ✅ instantiates`);
    getXMLObjectIds(tree, blueprint_object_ids);
  }

  return { template, builder, blueprint_object_ids };
}

function getXMLObjectIds(tree, object_ids) {
  for (const object of tree.getChildren("object")) {
    if (object.attrs.id) object_ids.push(object.attrs.id);
    // <child> or <property name="child">
    for (const child of object.getChildElements()) {
      getXMLObjectIds(child, object_ids);
    }
  }
}
