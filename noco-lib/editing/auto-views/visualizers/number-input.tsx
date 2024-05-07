import { numberVisualizerFactory } from "../headless-visualizers/number-input-factory";

export const numberInputVisualizer = numberVisualizerFactory((props) => (
  <input {...props} />
));
