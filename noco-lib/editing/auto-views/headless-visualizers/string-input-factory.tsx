import { ExpandedData } from "noco-lib/universal/types";
import { ComponentRepoRecordFactory } from "../components-repo";
import { AutoViewProps } from "../types";

export type StringInputVisualizerProps = AutoViewProps<ExpandedData<string>>;

export const stringInputVisualizerFactory: ComponentRepoRecordFactory<
  JSX.IntrinsicElements["input"],
  StringInputVisualizerProps
> = (Skin) => ({
  name: "string-input",
  predicate: (props) => props?.schema.type === "string",
  component: ({ data, onChange, dataId, schemaPointer }) => {
    return (
      <Skin
        type="text"
        value={data?.value || ""}
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
