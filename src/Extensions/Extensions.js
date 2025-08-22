import Gio from "gi://Gio";

import { build } from "../../troll/src/main.js";

import Interface from "./Extensions.blp" with { type: "uri" };
import illustration from "./extensions.svg";

import "./Extension.js";
import { settings } from "../util.js";

export const action_extensions = new Gio.SimpleAction({
  name: "extensions",
  parameter_type: null,
});

export function Extensions({ window }) {
  const {
    dialog,
    picture_illustration,
    extension_rust,
    extension_vala,
    extension_typescript,
    restart_hint,
    all_set_hint,
  } = build(Interface);

  picture_illustration.set_resource(illustration);

  // Availability checks (system paths instead of flatpak SDK)
  extension_rust.available = isRustAvailable();
  extension_vala.available = isValaAvailable();
  extension_typescript.available = isTypeScriptAvailable();
  extension_typescript.visible = isTypeScriptEnabled();

  for (const extension of [
    extension_rust,
    extension_vala,
    extension_typescript,
  ]) {
    if (!extension.available) {
      all_set_hint.set_visible(false);
      restart_hint.set_visible(true);
    }
  }

  action_extensions.connect("activate", () => {
    dialog.present(window);
  });

  window.add_action(action_extensions);
}

let rust_available = null;
export function isRustAvailable() {
  rust_available ??=
    Gio.File.new_for_path("/usr/bin/rustc").query_exists(null) &&
    Gio.File.new_for_path("/usr/bin/llvm-config").query_exists(null);
  return rust_available;
}

let vala_available = null;
export function isValaAvailable() {
  vala_available ??=
    Gio.File.new_for_path("/usr/bin/valac").query_exists(null);
  return vala_available;
}

let typescript_available = null;
export function isTypeScriptAvailable() {
  typescript_available ??=
    isTypeScriptEnabled() &&
    Gio.File.new_for_path("/usr/bin/tsc").query_exists(null) &&
    Gio.File.new_for_path("/usr/bin/node").query_exists(null);
  return typescript_available;
}

export function isTypeScriptEnabled() {
  return settings.get_boolean("typescript");
}
