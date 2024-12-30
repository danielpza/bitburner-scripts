declare namespace Bitburner {
  type NS = import("../NetScriptDefinitions.d.ts").NS;
  type Server = import("../NetScriptDefinitions.d.ts").Server;
  type AutocompleteData = import("../NetScriptDefinitions.d.ts").AutocompleteData;
  type Flags = Parameters<AutocompleteData["flags"]>[0];
}

declare const _: typeof import("lodash");
