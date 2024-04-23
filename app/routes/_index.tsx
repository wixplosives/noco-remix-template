import { componentRegistryContext } from "noco-lib/editing/component-registry-context";
import {
  NocoEditingPages,
  editingDataProviderContext,
} from "noco-lib/editing/editing-data-manager";
import { useNocoEditView } from "noco-lib/editing/noco-edit-view";
import React, { useCallback } from "react";
import "noco-lib/editing/noco-document.dev-example";
import { fetchPage, fetchPageList } from "data-mocks/apis";
import schema from "../noco/page.schema.json";
import { GUID } from "noco-lib/universal/types";
import { registry } from "~/noco/registry";
export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const dataManager = new NocoEditingPages(
  fetchPageList,
  fetchPage,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema as any
);

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <componentRegistryContext.Provider value={registry}>
        <editingDataProviderContext.Provider value={dataManager}>
          <InternalIndex />
        </editingDataProviderContext.Provider>
      </componentRegistryContext.Provider>
    </div>
  );
}

const InternalIndex = () => {
  const deserialize = useCallback(function <P>(
    Block: React.ComponentType<P>,
    props: P,
    key: GUID
  ) {
    return <Block {...props} key={key} />;
  },
  []);
  const res = useNocoEditView(deserialize);
  return res as JSX.Element;
};
