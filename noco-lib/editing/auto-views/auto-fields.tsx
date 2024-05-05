import React from "react";

import { allFields, filterAndOrderFields } from "./utils";

import { AutoView } from "./auto-view";
import { ExpandedData } from "noco-lib/universal/types";
import { CoreSchemaMetaSchema } from "./JSONSchema";
import { buildJsonPointer } from "./utils/build-json-pointer";
import { AutoViewProps } from "./types";

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
    data = {},
    schema: { properties = {}, additionalProperties },
    pick,
  } = autoViewProps;

  const fields = filterAndOrderFields(
    allFields(
      { type: "object", properties, additionalProperties },
      additionalProperties ? data : {}
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
    field,
  }: AutoViewProps<ExpandedData<Record<string, ExpandedData>>>
): AutoViewProps {
  return {
    schema: nextSchema(schema, fieldName),
    data: data?.value?.[fieldName],
    metadata,
    dataId: data?.value?.[fieldName]?.id,
    key: data?.value?.[fieldName]?.id || field,
    depth: depth ? depth + 1 : 1,
    schemaPointer: buildNextSchemaPointer(schema, schemaPointer, fieldName),
    repositoryName,
    onChange,
    onClick,
    onError,
    onRenderError,
    onCustomEvent,
    validation: false,
  };
}

export const AutoFields: React.FunctionComponent<AutoFieldsProps> = ({
  render = (a: React.ReactNode) => a,
  ...props
}) => (
  <>
    {autoFieldsProps(props).map((fieldProps) => {
      return render(
        <AutoView {...fieldProps} key={fieldProps.key} />,
        fieldProps,
        fieldProps.field
      );
    })}
  </>
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
