import { booleanInputVisualizerFactory } from "../headless-visualizers/boolean-input-factory";

export const booleanInputVisualizer = booleanInputVisualizerFactory((props) => (
  <input {...props} />
));
