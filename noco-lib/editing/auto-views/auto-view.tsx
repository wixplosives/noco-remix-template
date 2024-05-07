/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from "ajv";
import React, { useMemo } from "react";
import { formatValidationError } from "./utils/format-validation-error";
import { ComponentsRepo } from "./components-repo";
import { AutoEvent, AutoViewProps, SimpleTypes } from "./types";
import { useRepositoryContext } from "./repository";
import { RootSchemaProvider, schemaContext, useRefSchema } from "./root-schema";
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

const AutoViewLogic = (props: AutoViewLogicProps) => {
  const {
    schema,
    validation,
    data,
    validator,
    onError,
    schemaPointer,
    components,
  } = props;

  // useMemo(() => {
  //   validate({
  //     schema,
  //     validation: validation,
  //     data: data,
  //     validator: validator,
  //     onError: onError,
  //   });
  // }, [data, onError, schema, validation, validator, schema]);

  if (Array.isArray(schema.type)) {
    const { type: types, ...rest } = schema;

    let resolvedType: SimpleTypes | undefined = undefined;

    for (const type of types!) {
      const subSchema = { type, ...rest };
      const validate = validator.compile(subSchema);

      if (validate(data)) {
        resolvedType = type as SimpleTypes;
        break;
      }
    }

    if (!resolvedType) {
      throw new Error(`
                cannot resolve any type from "${JSON.stringify(
                  types
                )}" for "${schemaPointer}"
            `);
    }

    return (
      <AutoViewLogic
        {...props}
        schema={{ type: resolvedType, ...rest }}
        validation={false}
      />
    );
  }

  const matches = components.getMatched(props);

  if (matches.length > 0) {
    const componentRecord = matches.slice().pop();
    const Component = componentRecord!.component;
    const childProps = {
      ...props,
      schema,
    };
    const wrappers = components.getWrappers(childProps);

    return wrappers.reduce(
      (item, fn) => fn(item, childProps),
      <Component {...childProps} />
    );
  }
  throw Error(`cannot resolve component for "${schemaPointer}"`);
};

export const AutoView: React.FunctionComponent<AutoViewProps> = (props) => {
  const { components, validator } = useRepositoryContext();
  const { schema, isExternal, schemaId, rootSchema, ref } = useRefSchema(
    props.schema
  );
  const { schemaClient } = React.useContext(schemaContext);
  if (!schema) {
    return null;
  }
  if (isExternal) {
    if (!rootSchema) {
      return null;
    }
    return (
      <RootSchemaProvider
        schema={rootSchema}
        schemaId={schemaId}
        schemaClient={schemaClient}
      >
        <AutoViewLogic
          {...props}
          schema={schema}
          components={components}
          validator={validator}
          schemaPointer={ref}
        />
      </RootSchemaProvider>
    );
  }
  return (
    <AutoViewLogic
      {...props}
      components={components}
      validator={validator}
      schema={schema}
      schemaPointer={ref || props.schemaPointer}
    />
  );
};
