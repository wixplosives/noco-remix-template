import { ExpandedData } from "noco-lib/universal/types";
import { ComponentRepoRecordFactory } from "../components-repo";
import { AutoViewProps } from "../types";

export type NumberInputVisualizerProps = AutoViewProps<ExpandedData<number>>;

export const numberVisualizerFactory: ComponentRepoRecordFactory<
  JSX.IntrinsicElements["input"],
  NumberInputVisualizerProps
> = (Skin) => ({
  name: "number-input",
  predicate: (props) => props?.schema.type === "number",
  component: ({ data, onChange, dataId, schemaPointer }) => {
    return (
      <Skin
        type="number"
        value={data?.value}
        onChange={(ev) =>
          onChange?.(ev, {
            schemaPointer,
            patch: [
              {
                kind: "set",
                target: dataId,
                params: {
                  newValue: ev.target.value,
                },
              },
            ],
          })
        }
      />
    );
  },
});
