interface Props {
  time: number;
  ns: Bitburner.NS;
  progress?: boolean;
}

function Countdown(props: Props) {
  const [time, setTime] = React.useState(props.time);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime >= 0) return prevTime - 1000;
        clearInterval(interval);
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (props.progress) return <progress value={props.time - time} max={props.time}></progress>;

  return <>{props.ns.tFormat(time)}</>;
}

export default Countdown;
