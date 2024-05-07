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
import { enumInputVisualizer } from "noco-lib/editing/auto-views/visualizers/enum-input";
import { newTempGuid } from "noco-lib/universal/types";

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
  .register(booleanInputVisualizer)
  .register(enumInputVisualizer);
const repo = baseRepo.clone("LayoutRepo").addWrapper(
  (props) => (
    <div className="field">
      {props.field}:{props.children}
    </div>
  ),
  (node) => node?.schema.type !== "object"
);
repo.addWrapper(
  (props) => {
    const item = props.children;
    if (props.schema.title || props.field) {
      return (
        <div className="object">
          <h2>
            {props.field && <span>{props.field}</span>}
            {props.schema.title && props.field && <span>: </span>}
            {props.schema.title && <span>{props.schema.title}</span>}
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
      title: "Order",
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
    loggedInStatus: {
      type: "string",
      enum: ["logged in", "logged out"],
    },
    anonymousStatus: {
      type: "string",
      enum: ["anonymous"],
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
    orderInfo: {
      $ref: "#/definitions/anObject",
    },
    userInfo: {
      $ref: "schema2#/definitions/userInfo",
    },
    status: {
      oneOf: [
        {
          $ref: "#/definitions/loggedInStatus",
        },
        {
          $ref: "#/definitions/anonymousStatus",
        },
      ],
    },
  },
};

const appDefinition: CoreSchemaMetaSchema = {
  type: "object",

  definitions: {
    userInfo: {
      title: "User",
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        age: {
          type: "number",
        },
        title: {
          enum: ["Mr", "Mrs", "Miss", "false", false, 5, "5"],
        },
      },
    },
  },
};
const schemaClient = new SchemaClient();
schemaClient.setSchema("root-schema", schema);
schemaClient.setSchema("schema2", appDefinition);
export default createBoard({
  name: "layout",
  Board: () => {
    const [data, setData] = useState(initialData);
    const handleDataChange = (_ev: unknown, change: AutoChangeEvent) => {
      setData((prevData) => {
        return change.patch.reduce((prevData, change) => {
          if (change.kind === "set-new") {
            throw new Error("Not implemented");
          }
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
            dataId={newTempGuid}
            schemaPointer="root-schema"
            onChange={handleDataChange}
          />
        </RootSchemaProvider>
      </RepositoryProvider>
    );
  },
  environmentProps: {
    canvasWidth: 586,
    canvasHeight: 157,
  },
});
