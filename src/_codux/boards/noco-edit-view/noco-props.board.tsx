import "./noco-props.board.css";
import { createBoard } from "@wixc3/react-board";
import { ComponentsRepo } from "noco-lib/editing/auto-views/components-repo";
import { RepositoryProvider } from "noco-lib/editing/auto-views/repository";
import { AutoView } from "noco-lib/editing/auto-views/auto-view";
import { expandDataWithNewIds } from "noco-lib/universal/expander";
import { AutoFields } from "noco-lib/editing/auto-views/auto-fields";
import { CoreSchemaMetaSchema } from "noco-lib/editing/auto-views/JSONSchema";
import { stringInputVisualizer } from "noco-lib/editing/auto-views/visualizers/string-input";
import { NocoReducer } from "noco-lib/editing/reducer";
import { useState } from "react";
import { AutoChangeEvent } from "noco-lib/editing/auto-views/types";
import { numberInputVisualizer } from "noco-lib/editing/auto-views/visualizers/number-input";
import { booleanInputVisualizer } from "noco-lib/editing/auto-views/visualizers/boolean-input";
import {
  RootSchemaProvider,
  SchemaClient,
} from "noco-lib/editing/auto-views/root-schema";

const baseRepo = new ComponentsRepo("BaseRepo")
  .register({
    name: "unknown",
    predicate: () => true,
    component: () => <div>Unkown schema</div>,
  })
  .register({
    name: "AutoFields",
    predicate: () => schema?.type === "object",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: AutoFields as any,
  })

  .register(stringInputVisualizer)
  .register(numberInputVisualizer)
  .register(booleanInputVisualizer);
const repo = baseRepo.clone("LayoutRepo").addWrapper(
  (item, props) => (
    <div className="field">
      {props.field}:{item}
    </div>
  ),
  (node) => node?.schema.type !== "object"
);
repo.addWrapper(
  (item, props) => {
    if (props.schema.title) {
      return (
        <div className="object">
          <h2>
            {props.field} {props.schema.title}
          </h2>
          {item}
        </div>
      );
    }
    return item;
  },
  (node) => node?.schema.type === "object"
);

export const initialData = expandDataWithNewIds({
  login: "johondoe",
  age: 21,
  active: true,
});

const schema: CoreSchemaMetaSchema = {
  type: "object",

  definitions: {
    anObject: {
      title: "An Object",
      type: "object",
      properties: {
        a: {
          type: "string",
        },
        b: {
          type: "number",
        },
        c: {
          type: "boolean",
        },
      },
    },
  },
  properties: {
    login: {
      type: "string",
    },
    age: {
      type: "number",
    },
    active: {
      type: "boolean",
    },
    localRef: {
      $ref: "#/definitions/anObject",
    },
    otherRef: {
      $ref: "schema2#/definitions/anObject",
    },
  },
};

const schema2: CoreSchemaMetaSchema = {
  type: "object",

  definitions: {
    anObject: {
      title: "An Object",
      type: "object",
      properties: {
        a: {
          type: "string",
        },
        b: {
          type: "number",
        },
        c: {
          type: "boolean",
        },
      },
    },
  },
};
const schemaClient = new SchemaClient();
schemaClient.setSchema("root-schema", schema);
schemaClient.setSchema("schema2", schema2);
export default createBoard({
  name: "layout",
  Board: () => {
    const [data, setData] = useState(initialData);
    const handleDataChange = (_ev: unknown, change: AutoChangeEvent) => {
      setData((prevData) => {
        return change.patch.reduce((prevData, change) => {
          return NocoReducer(prevData, change);
        }, prevData);
      });
    };
    return (
      <RepositoryProvider components={repo}>
        <RootSchemaProvider
          schema={schema}
          schemaClient={schemaClient}
          schemaId="root-schema"
        >
          <AutoView
            schema={schema}
            data={data}
            schemaPointer="root-schema"
            onChange={handleDataChange}
          />
        </RootSchemaProvider>
      </RepositoryProvider>
    );
  },
  environmentProps: {
    canvasWidth: 408,
    canvasHeight: 157,
  },
});
