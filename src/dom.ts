/** @see https://bitburner.readthedocs.io/en/latest/netscript/advancedfunctions/inject_html.html */
export function execCommand(command: string) {
  /* eslint-disable */
  // Acquire a reference to the terminal text field
  const terminalInput = document.getElementById("terminal-input") as any;

  if (!terminalInput) throw new Error("Expected terminal input to exist");

  // Set the value to the command you want to run.
  terminalInput.value = command;
  // Get a reference to the React event handler.
  const handler = Object.keys(terminalInput)[1];
  // Perform an onChange event to set some internal values.
  terminalInput[handler].onChange({ target: terminalInput });
  // Simulate an enter press
  terminalInput[handler].onKeyDown({ keyCode: 13, preventDefault: () => null });
  /* eslint-enable */
}

export function setup(element: import("react").ReactElement) {
  const ReactDOM = window.ReactDOM;
  const root = document.createElement("div");
  document.body.appendChild(root);

  ReactDOM.render(element, root);

  return () => {
    ReactDOM.unmountComponentAtNode(root);
    root.remove();
  };
}
