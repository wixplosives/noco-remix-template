import { enumInputVisualizerFactory } from "../headless-visualizers/enum-input-factory";

export const enumInputVisualizer = enumInputVisualizerFactory((props) => (
  <select {...props} />
));
