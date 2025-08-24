import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import { build } from "../../troll/src/main.js";

import Interface from "./Permissions.blp" with { type: "uri" };

import illustration from "./permissions.svg";

import {
  getFlatpakId,
  getFlatpakInfo,
  isDeviceInputOverrideAvailable,
} from "../flatpak.js";

const device = isDeviceInputOverrideAvailable() ? "input" : "all";

const action_permissions = new Gio.SimpleAction({
  name: "permissions",
  parameter_type: null,
});

export function Permissions({ window }) {
  const {
    dialog,
    picture_illustration,
    label_command,
    button_info,
    action_row_device,
  } = build(Interface);

  picture_illustration.set_resource(illustration);

  label_command.label = `flatpak override --user --share=network --socket=pulseaudio --device=${device} ${getFlatpakId()}`;
  action_row_device.title = `--input=${device}`;

  button_info.connect("clicked", () => {
    new Gtk.UriLauncher({
      uri: "https://docs.flatpak.org/en/latest/sandbox-permissions.html",
    })
      .launch(window, null)
      .catch(console.error);
  });

  action_permissions.connect("activate", () => {
    dialog.present(window);
  });

  window.add_action(action_permissions);
}

const missing_permissions = (() => {
  let shared = [], sockets = [], devices = [];
  try {
    const flatpak_info = getFlatpakInfo();
    if (flatpak_info) {
      shared = flatpak_info.get_string_list("Context", "shared");
      sockets = flatpak_info.get_string_list("Context", "sockets");
      devices = flatpak_info.get_string_list("Context", "devices");
    }
  } catch (_) {

  }

  return (
    !shared.includes("network") ||
    !sockets.includes("pulseaudio") ||
    !devices.includes(device)
  );
})();

export function needsAdditionalPermissions({ demo }) {
  if (!demo["flatpak-finish-args"]) return false;
  return missing_permissions;
}

export function showPermissionsDialog({ window }) {
  window.activate_action("permissions", null);
}
