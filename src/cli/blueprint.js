/* eslint-disable no-restricted-globals */

import Gtk from "gi://Gtk";

import { getLanguage } from "../common.js";
import { parse } from "../langs/xml/xml.js";
import { LSPError } from "../lsp/LSP.js";
import { waitForDiagnostics } from "./lint.js";
import { serializeDiagnostics, checkFile } from "./util.js";

export default async function blueprint({ file_blueprint, lsp_clients }) {
  print(`  ${file_blueprint.get_path()}`);
  const uri = file_blueprint.get_uri();
  const languageId = "blueprint";
  let version = 0;

  const [contents] = await file_blueprint.load_contents_async(null);
  const text = new TextDecoder().decode(contents);

  await lsp_clients.blueprint._notify("textDocument/didOpen", {
    textDocument: {
      uri,
      languageId,
      version: version++,
      text,
    },
  });

  const diagnostics = await waitForDiagnostics({
    uri,
    lspc: lsp_clients.blueprint,
  });
  if (diagnostics.length > 0) {
    printerr(serializeDiagnostics({ diagnostics }));
    return false;
  }

  print(`  ✅ lints`);

  const { xml } = await lsp_clients.blueprint._request(
    "textDocument/x-blueprint-compile",
    {
      textDocument: {
        uri,
      },
    },
  );

  print(`  ✅ compiles`);

  try {
    await lsp_clients.blueprint._request("x-blueprint/decompile", {
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
    lspc: lsp_clients.blueprint,
    file: file_blueprint,
    lang: getLanguage("blueprint"),
    uri,
  });
  if (!checks) return false;

  await lsp_clients.blueprint._notify("textDocument/didClose", {
    textDocument: {
      uri,
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
