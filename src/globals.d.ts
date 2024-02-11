declare namespace Bitburner {
  type NS = import("../NetScriptDefinitions.d.ts").NS;
  type AutocompleteData =
    import("../NetScriptDefinitions.d.ts").AutocompleteData;
  type Flags = Parameters<AutocompleteData["flags"]>[0];
}

declare global {
  interface Window {
    React: typeof import("react");
    ReactDOM: typeof import("react-dom");
  }
}
