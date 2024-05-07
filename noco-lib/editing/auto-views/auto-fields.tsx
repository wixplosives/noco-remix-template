import React from "react";

import { allFields, filterAndOrderFields } from "./utils";

import { AutoView } from "./auto-view";
import {
  ExpandedData,
  GUID,
  NocoChange,
  generateGUID,
  newTempGuid,
} from "noco-lib/universal/types";
import { CoreSchemaMetaSchema } from "./JSONSchema";
import { buildJsonPointer } from "./utils/build-json-pointer";
import { AutoViewChange, AutoViewProps } from "./types";
import { expandDataWithNewIds } from "noco-lib/universal/expander";
import { NocoReducer } from "../reducer";
import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";

export interface AutoFieldsProps
  extends AutoViewProps<ExpandedData<Record<string, ExpandedData>>> {
  render?(
    item: React.ReactNode,
    props: AutoViewProps,
    key: string
  ): React.ReactNode;
}

export function autoFieldsProps(
  autoViewProps: AutoViewProps<ExpandedData<Record<string, ExpandedData>>>
): Array<AutoViewProps & { field: string }> {
  const {
    data,
    schema: { properties = {}, additionalProperties },
    pick,
  } = autoViewProps;

  const fields = filterAndOrderFields(
    allFields(
      { type: "object", properties, additionalProperties },
      additionalProperties
        ? data?.value || ({} as Record<string, ExpandedData>)
        : ({} as Record<string, ExpandedData>)
    ), // if schema has additionalProperties, take fields from `data`
    pick
  );

  return fields.map((field) => ({
    field,
    ...getAutoFieldProps(field, autoViewProps),
  }));
}

export function getAutoFieldProps(
  fieldName: string,
  {
    data,
    metadata,
    schema,
    schemaPointer,
    repositoryName,
    onChange,
    onClick,
    onError,
    onRenderError,
    onCustomEvent,
    depth,
  }: AutoViewProps<ExpandedData<Record<string, ExpandedData>>>
): AutoViewProps {
  const fieldData = data?.value?.[fieldName];
  const required = schema.required?.includes(fieldName);
  let onFieldChange = onChange;
  if (!fieldData) {
    onFieldChange = (e, { patch }) => {
      const newObj = data || expandDataWithNewIds({});
      const dataId = newObj.id as GUID<"object">;
      const updatedChanges = patch.map<AutoViewChange>((change) => {
        if (change.kind === "set-new") {
          return {
            kind: "setProperty",
            target: dataId,
            params: {
              propertyName: fieldName,
              newValue: change.params.newValue,
            },
          };
        }
        if (change.kind === "set" && change.target === newTempGuid) {
          return {
            kind: "setProperty",
            target: dataId,
            params: {
              propertyName: fieldName,
              newValue: expandDataWithNewIds(change.params.newValue),
            },
          };
        }
        return {
          ...change,
          target:
            change.target === newTempGuid ? (dataId as any) : change.target,
        };
      });

      if (!data?.value) {
        updatedChanges.unshift({
          kind: "set-new",
          target: newTempGuid,
          params: {
            newValue: newObj,
          },
        });
      }
      onChange?.(e, {
        patch: updatedChanges,
        schemaPointer,
      });
    };
  }
  return {
    schema: nextSchema(schema, fieldName),
    data: fieldData,
    metadata,
    dataId: fieldData?.id || newTempGuid,
    key: fieldName,
    field: fieldName,
    depth: depth ? depth + 1 : 1,
    schemaPointer: buildNextSchemaPointer(schema, schemaPointer, fieldName),
    repositoryName,
    onChange: onFieldChange,
    onClick,
    onError,
    onRenderError,
    onCustomEvent,
    validation: false,
    required,
  };
}

export const AutoFields: React.FunctionComponent<AutoFieldsProps> = ({
  render = (a: React.ReactNode) => a,
  ...props
}) => (
  <div>
    {autoFieldsProps(props).map((fieldProps) => {
      return render(
        <AutoView {...fieldProps} key={fieldProps.key} />,
        fieldProps,
        fieldProps.field
      );
    })}
  </div>
);

export type AutoItemsProps = {
  render?(
    item: React.ReactNode,
    props: AutoViewProps,
    index: number
  ): React.ReactNode;
} & AutoViewProps;

export const AutoItems = ({ render = (a) => a, ...props }: AutoItemsProps) => (
  <>
    {autoItemsProps(props).map((itemProps, index) =>
      render(<AutoView {...itemProps} key={itemProps.key} />, itemProps, index)
    )}
  </>
);

const ensureArrayData = (
  data: ExpandedData | undefined,
  schema: CoreSchemaMetaSchema
): ExpandedData[] => {
  if (data && Array.isArray(data)) {
    return data;
  }

  return Array.isArray(schema.prefixItems)
    ? new Array(schema.prefixItems.length).fill(undefined)
    : [];
};

export function autoItemsProps({
  data,
  metadata,
  schema,
  schemaPointer,
  repositoryName,
  onChange,
  onClick,
  onError,
  onRenderError,
  onCustomEvent,
}: AutoViewProps): AutoViewProps[] {
  return ensureArrayData(data, schema).map((item, i) => ({
    schema: nextSchema(schema, i),
    data: item,
    metadata,
    dataId: item.id,
    schemaPointer: buildNextSchemaPointer(
      schema,
      schemaPointer || "",
      String(i)
    ),
    repositoryName,
    onChange,
    onClick,
    onError,
    onRenderError,
    onCustomEvent,
    validation: false,
  }));
}

const findPrefixMatch = (
  prefixItems?: AutoViewProps["schema"]["prefixItems"],
  index?: number | string
) => {
  if (
    Array.isArray(prefixItems) &&
    typeof index === "number" &&
    prefixItems[index]
  ) {
    return prefixItems[index];
  }
};

export function nextSchema(
  schema: AutoViewProps["schema"],
  dataPointer?: string | number
): AutoViewProps["schema"] {
  if (schema.type === "array") {
    return (
      findPrefixMatch(schema.prefixItems, dataPointer) ??
      schema.items ??
      schema.additionalItems ??
      {}
    );
  }

  if (dataPointer !== undefined && schema.type === "object") {
    const { properties = {}, additionalProperties } = schema;
    const additional =
      typeof additionalProperties === "object" ? additionalProperties : {};
    return properties[dataPointer] ?? additional;
  }

  throw Error("array schema or object schema and dataPointer expected");
}

export function buildNextSchemaPointer(
  schema: AutoViewProps["schema"],
  schemaPointer: string,
  pathPart: string
): string {
  if (schema.type === "array") {
    return schemaPointer + "/" + "items";
  }

  if (schema.type === "object") {
    const isAdditional = !(pathPart in (schema.properties || {}));
    return isAdditional
      ? buildJsonPointer(schemaPointer, "additionalProperties")
      : buildJsonPointer(schemaPointer, "properties", pathPart);
  }
  throw Error("object or array schema expected");
}

export const AnyData: React.FunctionComponent<AutoViewProps> = (props) => (
  <pre>{JSON.stringify(props.data, null, 4)}</pre>
);
