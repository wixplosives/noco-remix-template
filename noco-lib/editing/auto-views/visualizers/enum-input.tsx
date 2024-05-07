import { enumInputVisualizerFactory } from "../headless-visualizers/enum-input-factory";

export const enumInputVisualizer = enumInputVisualizerFactory((props) => (
  <select
    value={props.value}
    onChange={(ev) => props.onChange(ev, ev.target.value)}
  >
    {props.options.map((o) => (
      <option key={o.key} value={o.key}>
        {JSON.stringify(o.value)}
      </option>
    ))}
  </select>
));
