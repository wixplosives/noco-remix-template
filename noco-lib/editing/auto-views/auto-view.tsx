/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from "ajv";
import React, { useMemo } from "react";
import { formatValidationError } from "./utils/format-validation-error";
import { ComponentsRepo } from "./components-repo";
import { AutoEvent, AutoViewProps, SimpleTypes } from "./types";
import { useRepositoryContext } from "./repository";
import {
  RootSchemaProvider,
  schemaContext,
  splitRef,
  useRefSchema,
} from "./root-schema";
import { expandDataWithNewIds } from "noco-lib/universal/expander";

export type AutoEventHandler<TEvent extends AutoEvent = AutoEvent> = (
  e: Event,
  autoEvent: TEvent
) => void;

interface AutoViewLogicProps extends AutoViewProps {
  components: ComponentsRepo;
  validator: Ajv.Ajv;
}

const validate = (
  props: Pick<
    AutoViewLogicProps,
    "schema" | "validation" | "data" | "validator" | "onError"
  >
) => {
  const { schema, validation, data, validator, onError } = props;

  if (validation && onError) {
    const validate = validator.compile(schema);
    const isValid = validate(data);

    if (!isValid && validate.errors!.length) {
      onError(formatValidationError(validate.errors![0]));
    }
  }
};

export const AutoView = (props: AutoViewProps) => {
  const { schema, validation, data, onError, schemaPointer } = props;
  const { components, validator } = useRepositoryContext();
  const schemaRes = useRefSchema(schemaPointer, schema);
  const { schemaClient, schemaId } = React.useContext(schemaContext);
  let resolvedSchema = schemaRes?.schemas[0];

  // useMemo(() => {
  //   validate({
  //     schema,
  //     validation: validation,
  //     data: data,
  //     validator: validator,
  //     onError: onError,
  //   });
  // }, [data, onError, schema, validation, validator, schema]);

  if (schemaRes?.schemas.length || 0 > 1) {
    for (const subSchema of schemaRes?.schemas!) {
      const validate = validator.compile(subSchema);

      if (validate(data)) {
        resolvedSchema = subSchema;
        break;
      }
    }
  }
  const [selected, setSelected] = React.useState(resolvedSchema?.schemaPointer);
  if (!resolvedSchema) {
    return null;
  }

  const showSchemaPointer = selected || resolvedSchema.schemaPointer;
  const showSchema = selected
    ? schemaRes?.schemas.find((s) => s.schemaPointer === selected)?.schema ||
      resolvedSchema.schema
    : resolvedSchema.schema;
  const childProps = {
    ...props,
    schema: showSchema,
    schemaPointer: showSchemaPointer,
  };
  const matches = components.getMatched(childProps);

  if (matches.length > 0) {
    const componentRecord = matches.slice().pop();
    const UnionSelector =
      (schemaRes?.schemas.length || 0) > 1
        ? components.getUnionSelectors(childProps, schemaRes!.schemas)?.pop()
        : undefined;
    const Component = componentRecord!.component;

    const wrappers = components.getWrappers(childProps);
    let view = wrappers.reduce(
      (item, Comp) => <Comp {...childProps}>{item}</Comp>,
      <Component {...childProps} />
    );
    if (UnionSelector) {
      view = (
        <UnionSelector
          {...childProps}
          select={setSelected}
          selected={showSchemaPointer}
          schemas={schemaRes!.schemas}
        >
          {view}
        </UnionSelector>
      );
    }
    if (resolvedSchema.isExternal) {
      const externalSchemaId = splitRef(resolvedSchema.schemaPointer).id;
      return (
        <RootSchemaProvider
          schema={schemaClient?.getRootSchema(externalSchemaId) || {}}
          schemaId={externalSchemaId}
          schemaClient={schemaClient}
        >
          {view}
        </RootSchemaProvider>
      );
    }
    return view;
  }
  throw Error(`cannot resolve component for "${schemaPointer}"`);
};
