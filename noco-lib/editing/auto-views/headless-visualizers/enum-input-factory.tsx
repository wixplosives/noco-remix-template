import { ExpandedData, newTempGuid } from "noco-lib/universal/types";
import { ComponentRepoRecordFactory } from "../components-repo";
import { AutoViewProps } from "../types";
import { CoreSchemaMetaSchema } from "../JSONSchema";

export type EnumInputVisualizerProps = AutoViewProps<ExpandedData>;

export const getEnumOptions = (schema?: CoreSchemaMetaSchema): unknown[] => {
  if (!schema) {
    return [];
  }
  if (schema.oneOf) {
    return schema.oneOf.flatMap(getEnumOptions);
  }
  if (schema.enum) {
    return schema.enum;
  }
  if (schema.const) {
    return [schema.const];
  }
  return [];
};
export const hasOnlyEnumOptions = (
  schema?: CoreSchemaMetaSchema
): boolean | "single" => {
  if (!schema) {
    return false;
  }
  if (schema.const) {
    return "single";
  }
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum.length === 1 ? "single" : true;
  }
  if (schema.oneOf) {
    let hasEnum = false;
    let hasSingle = false;
    for (const subSchema of schema.oneOf) {
      const result = hasOnlyEnumOptions(subSchema);
      if (result === "single") {
        if (hasSingle) {
          hasEnum = true;
        }
        hasSingle = true;
      } else if (result) {
        hasEnum = true;
      } else {
        return false;
      }
    }
  }
  return false;
};
export const enumInputVisualizerFactory: ComponentRepoRecordFactory<
  JSX.IntrinsicElements["select"],
  EnumInputVisualizerProps
> = (Skin) => ({
  name: "enum-input",
  predicate: (props) => hasOnlyEnumOptions(props?.schema) === true,
  component: ({ data, onChange, dataId, schemaPointer, schema }) => {
    const options = getEnumOptions(schema);
    const idx = options.findIndex((o) => o === data?.value);
    return (
      <div>
        <select
          value={idx}
          onChange={(ev) => {
            const newIdx = parseInt(ev.target.value);
            if (newIdx === idx) {
              return;
            }
            const newData = options[newIdx];
            onChange?.(ev, {
              schemaPointer,
              patch: [
                {
                  kind: "set",
                  target: dataId,
                  params: {
                    newValue: newData as any,
                  },
                },
              ],
            });
          }}
        >
          {options.map((option, idx) => (
            <option key={idx} label={option?.toString()} value={idx} />
          ))}
        </select>
      </div>
    );
  },
});
