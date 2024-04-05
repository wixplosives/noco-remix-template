import { ComponentRegistry } from "noco-lib/editing/component-registry";
import { componentRegistryContext } from "noco-lib/editing/component-registry-context";
import { pageTemplates } from "~/noco/page-templates";
import { sections } from "~/noco/sections";
import homeData from "../../data-mocks/home.json";
import pageList from "../../data-mocks/page-list.json";
import {
  EditingDataManager,
  editingDataProviderContext,
} from "noco-lib/editing/editing-data-manager";
import { expandDataWithNewIds } from "noco-lib/universal/expander";
import { ExpandedDataWithBlock, GUID } from "noco-lib/universal/types";
import { systemErrors } from "noco-lib/editing/noco-error-view";
import { useNocoEditView } from "noco-lib/editing/noco-edit-view";
import { useCallback } from "react";
import "noco-lib/editing/noco-document";
export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const componentRegistry = new ComponentRegistry();
componentRegistry.registerAll(systemErrors);
componentRegistry.registerAll(pageTemplates);
componentRegistry.registerAll(sections);

const fetchPageList = async () => expandDataWithNewIds(pageList);
const fetchPage = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = homeData as any;
  return expandDataWithNewIds(data) as unknown as ExpandedDataWithBlock;
};

const dataManager = new EditingDataManager(fetchPageList, fetchPage);

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <componentRegistryContext.Provider value={componentRegistry}>
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
