import { useForceRender } from "../hooks/useForceRender";
import { useInterval } from "../hooks/useInterval";

interface Props {
  time: number;
  ns: Bitburner.NS;
  progress?: boolean;
}

function Countdown(props: Props) {
  const [{ startTime, endTime }] = React.useState(() => {
    const now = Date.now();
    return {
      startTime: now,
      endTime: now + props.time,
    };
  });

  const refresh = useForceRender();
  useInterval(refresh, 1000);

  const now = Date.now();

  if (props.progress) return <progress value={now - startTime} max={endTime - startTime}></progress>;

  return formatTime(endTime - now);

  function formatTime(value: number) {
    return Math.floor(value / 1000) + "s";
  }
}

export default Countdown;
