import { stringInputVisualizerFactory } from "../headless-visualizers/string-input-factory";

export const stringInputVisualizer = stringInputVisualizerFactory((props) => (
  <input {...props} />
));
