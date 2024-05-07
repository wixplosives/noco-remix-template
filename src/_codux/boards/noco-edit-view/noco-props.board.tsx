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
import { fieldWrapperRecord } from "noco-lib/editing/auto-views/wrappers/field-wrapper";
import { objectWrapperRecord } from "noco-lib/editing/auto-views/wrappers/object-wrapper";
import { fieldUnionSelectorRecord } from "noco-lib/editing/auto-views/union-selectors/field-union-selector";

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
const repo = baseRepo.clone("LayoutRepo").addWrapper(fieldWrapperRecord);
repo.addWrapper(objectWrapperRecord);
repo.addUnionSelector(fieldUnionSelectorRecord);
export const initialData = expandDataWithNewIds({
  login: "johondoe",
  age: 21,
  active: true,
  visitorOrUserOrString: {
    name: "John",
    age: 21,
  },
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
    visitorOrUserOrString: {
      oneOf: [
        {
          $ref: "schema2#/definitions/userInfo",
        },
        {
          $ref: "schema2#/definitions/visitorInfo",
        },
        {
          type: "string",
        },
      ],
    },
    login: {
      type: "string",
    },
    age: {
      type: "number",
    },
    active: {
      type: "boolean",
    },
    simpleUnion: {
      type: ["string", "number"],
    },
    simpleUnionVerbose: {
      oneOf: [
        {
          type: "string",
        },
        {
          type: "number",
        },
      ],
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
      required: ["name", "age"],
    },
    visitorInfo: {
      title: "Visitor",
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        age: {
          type: "number",
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
