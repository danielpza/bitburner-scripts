import { setup } from "./dom";
import Draggable from "https://cdn.skypack.dev/react-draggable";
import { ResizableBox } from "https://cdn.skypack.dev/react-resizable";

function Box({ children }: { children: import("react").ReactNode }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0 }}>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Draggable
        defaultPosition={{ x: 0, y: 0 }}
        bounds="body"
        offsetParent={document.body}
      >
        <div
          style={{
            backgroundColor: "black",
            color: "#00c600",
            border: "solid 2px #333333",
          }}
        >
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <ResizableBox
            width={100}
            height={100}
            // resizeHandles={["sw", "se", "nw", "ne", "w", "e", "n", "s"]}
            resizeHandles={["se"]}
            // minConstraints={[100, 100]}
            // maxConstraints={[300, 300]}
          >
            {children}
          </ResizableBox>
        </div>
      </Draggable>
    </div>
  );
}

export async function main(ns: NS) {
  function App() {
    return (
      <>
        <Box>lkasdlkjlasdlkjaslkdalskjd</Box>
        <ResizableBox
          width={100}
          height={100}
          // resizeHandles={["sw", "se", "nw", "ne", "w", "e", "n", "s"]}
          resizeHandles={["se"]}
          minConstraints={[100, 100]}
          maxConstraints={[300, 300]}
        >
          jsd fs sdlkjaskldjalskjdlkasldkjhello
        </ResizableBox>
      </>
    );
  }

  const unmount = setup(<App />);

  ns.atExit(unmount);
  ns.tail();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await ns.sleep(1000000);
  }
}
