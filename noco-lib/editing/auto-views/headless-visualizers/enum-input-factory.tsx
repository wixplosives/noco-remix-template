import { ExpandedData, newTempGuid } from "noco-lib/universal/types";
import { ComponentRepoRecordFactory } from "../components-repo";
import { AutoViewProps } from "../types";
import { CoreSchemaMetaSchema } from "../JSONSchema";
import { ChangeEvent } from "react";
import { expandDataWithNewIds } from "noco-lib/universal/expander";

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
export type EnumInputVisualizerProps = Omit<
  JSX.IntrinsicElements["select"],
  "children" | "onChange"
> & {
  options: Array<{ key: string; value: unknown }>;
  onChange: (key: string) => void;
};
export const enumInputVisualizerFactory: ComponentRepoRecordFactory<
  Omit<JSX.IntrinsicElements["select"], "children" | "onChange"> & {
    options: Array<{ key: string; value: unknown }>;
    onChange: (e: ChangeEvent, key: string) => void;
  },
  AutoViewProps
> = (Skin) => ({
  name: "enum-input",
  predicate: (props) => hasOnlyEnumOptions(props?.schema) === true,
  component: ({ data, onChange, dataId, schemaPointer, schema }) => {
    const options = getEnumOptions(schema);
    const keydOptions: Array<{ key: string; value: unknown }> = options.map(
      (item, idx) => ({ key: idx.toString(), value: item })
    );
    const key = keydOptions.find((o) => o === data?.value)?.key;

    return (
      <Skin
        value={key}
        onChange={(e, key) => {
          const value = keydOptions.find((o) => o.key === key)?.value;
          const expandedValue = isArrayOrObject(value)
            ? expandDataWithNewIds(value)
            : value;
          onChange?.(e, {
            schemaPointer,
            patch: [
              {
                kind: "set",
                target: dataId,
                params: {
                  newValue: expandedValue as any,
                },
              },
            ],
          });
        }}
        options={keydOptions}
      />
    );
  },
});

const isArrayOrObject = (
  value: unknown
): value is unknown[] | Record<string, unknown> => {
  return !!value && (Array.isArray(value) || typeof value === "object");
};
