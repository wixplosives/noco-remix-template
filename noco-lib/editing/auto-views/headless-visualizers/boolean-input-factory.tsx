import { ExpandedData } from "noco-lib/universal/types";
import { ComponentRepoRecordFactory } from "../components-repo";
import { AutoViewProps } from "../types";

export type BooleanInputVisualizerProps = AutoViewProps<ExpandedData<boolean>>;

export const booleanInputVisualizerFactory: ComponentRepoRecordFactory<
  JSX.IntrinsicElements["input"],
  BooleanInputVisualizerProps
> = (Skin) => ({
  name: "boolean-input",
  predicate: (props) => props?.schema.type === "boolean",
  component: ({ data, onChange, dataId, schemaPointer }) => {
    return (
      <Skin
        type="checkbox"
        value={data?.value ? "on" : "off"}
        onChange={(ev) =>
          dataId &&
          onChange?.(ev, {
            nodeId: dataId,
            schemaPointer,
            patch: [
              {
                kind: "set",
                target: dataId,
                params: {
                  newValue: ev.target.value === "on",
                },
              },
            ],
          })
        }
      />
    );
  },
});
