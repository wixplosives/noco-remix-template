import React, { useMemo } from "react";
import { CoreSchemaMetaSchema } from "./JSONSchema";
import { EventEmitter } from "@wixc3/patterns";

export interface SchemaEvents {
  update: {
    id: string;
  };
}
export class SchemaClient extends EventEmitter<SchemaEvents> {
  private schemas: Record<string, CoreSchemaMetaSchema> = {};
  private loadingSchemas: Record<
    string,
    Promise<CoreSchemaMetaSchema | undefined>
  > = {};

  constructor(
    preloadedSchemas: Record<string, CoreSchemaMetaSchema> = {},
    private fetchSchema?: (
      path: string
    ) => Promise<CoreSchemaMetaSchema | undefined>
  ) {
    super();
    this.schemas = { ...preloadedSchemas };
  }
  getRootSchema(id: string): CoreSchemaMetaSchema | undefined {
    return this.schemas[id];
  }

  getSchema(ref: string): CoreSchemaMetaSchema | null {
    const { id, innerPath } = splitRef(ref);
    const schema = this.schemas[id];
    if (!innerPath) {
      return schema || null;
    }
    if (schema) {
      return getFromPojo<CoreSchemaMetaSchema, CoreSchemaMetaSchema>(
        schema,
        innerPath
      );
    }
    return null;
  }
  loadSchema(id: string): Promise<CoreSchemaMetaSchema | undefined> {
    const allReadyLoaded = this.schemas[id];
    if (allReadyLoaded) {
      return Promise.resolve(allReadyLoaded);
    }
    const loading = this.loadingSchemas[id];
    if (loading) {
      return loading;
    }
    if (this.fetchSchema) {
      const promise = this.fetchSchema(id).then((schema) => {
        if (schema) {
          this.schemas[id] = schema;
          this.emit("update", { id });
        }
        return schema;
      });
      this.loadingSchemas[id] = promise;
      return promise;
    }
    return Promise.resolve(undefined);
  }
  loadSchemaFromRef(ref: string): Promise<CoreSchemaMetaSchema | undefined> {
    const { id, innerPath } = splitRef(ref);
    if (innerPath) {
      return this.loadSchema(id).then((schema) => {
        if (schema) {
          return (
            getFromPojo<CoreSchemaMetaSchema, CoreSchemaMetaSchema>(
              schema,
              innerPath
            ) || undefined
          );
        }
        return undefined;
      });
    }
    return this.loadSchema?.(id);
  }

  setSchema(id: string, schema: CoreSchemaMetaSchema) {
    this.schemas[id] = schema;
    this.emit("update", { id });
  }
}
export interface RootSchemaContextProps {
  schema?: CoreSchemaMetaSchema;
  schemaClient?: SchemaClient;
  schemaId?: string;
}

export const schemaContext = React.createContext<RootSchemaContextProps>({
  schema: undefined,
});

export const RootSchemaProvider: React.FC<{
  schema: CoreSchemaMetaSchema;
  schemaId?: string;
  schemaClient?: SchemaClient;
  children?: React.ReactNode;
}> = ({ schema, children, schemaClient, schemaId }) => (
  <schemaContext.Provider value={{ schema, schemaClient, schemaId }}>
    {children}
  </schemaContext.Provider>
);
export const getidAndInnerPath = (ref: string) => {
  const [id, innerPath] = ref.split("#");
  return { id, innerPath };
};
export const splitRef = (ref: string) => {
  const { id, innerPath } = getidAndInnerPath(ref);
  return { id, innerPath: innerPath?.split("/").filter(Boolean) };
};

export function getFromPojo<T, U>(
  value: T,
  path: Array<string | number>
): null | U {
  const [current, ...rest] = path;
  if (current === undefined) {
    return value as unknown as U;
  }
  switch (typeof value) {
    case "object":
      if (value) {
        if (Array.isArray(value)) {
          const currentIndex = Number(current);
          if (
            isNaN(currentIndex) ||
            value.length <= currentIndex ||
            currentIndex < 0
          ) {
            throw new Error("incorrect index of array in getFromPojo");
          }
          return getFromPojo(value[currentIndex], rest);
        } else if (current === null) {
          throw new Error("unexistant path in get from POJO");
        } else if (current in value) {
          return getFromPojo((value as Record<string, unknown>)[current], rest);
        }
      }
      break;
  }
  return null;
}

export const useRefSchema = (inputSchema: CoreSchemaMetaSchema) => {
  const { schemaClient, schemaId } = React.useContext(schemaContext);
  const [schema, setSchema] = React.useState<CoreSchemaMetaSchema | undefined>(
    undefined
  );
  const refInfo = useMemo(
    () =>
      inputSchema.$ref !== undefined
        ? getidAndInnerPath(inputSchema.$ref)
        : undefined,
    [inputSchema.$ref]
  );
  React.useEffect(() => {
    if (!schemaClient || !refInfo) {
      return;
    }
    const ref =
      refInfo.id === ""
        ? schemaId + "#" + refInfo.innerPath
        : refInfo.id + "#" + refInfo.innerPath;
    const preloaded = schemaClient.getSchema(ref);
    if (preloaded) {
      setSchema(preloaded);
      return;
    }
    schemaClient.loadSchemaFromRef(ref).then((schema) => {
      setSchema(schema);
    });
  }, [inputSchema.$ref, schemaClient]);
  const isExternal = refInfo?.id && refInfo.id !== schemaId;
  return inputSchema.$ref
    ? {
        schema,
        ref: inputSchema.$ref,
        isExternal,
        schemaId: refInfo?.id,
        rootSchema: refInfo?.id
          ? schemaClient?.getSchema(refInfo?.id)
          : undefined,
      }
    : {
        schema: inputSchema,
        ref: undefined,
        isExternal,
        schemaId,
        rootSchema: undefined,
      };
};
