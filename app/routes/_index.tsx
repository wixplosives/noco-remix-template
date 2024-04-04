import { ComponentRegistry } from "noco-lib/editing/component-registry";
import { componentRegistryContext } from "noco-lib/editing/use-component";
import { pageTemplates } from "~/noco/page-templates";
import { sectionMap } from "~/noco/sections";
import homeData from "../../data-mocks/home.json";
import pageList from "../../data-mocks/page-list.json";
import {
  EditingDataManager,
  editingDataProviderContext,
} from "noco-lib/editing/editing-data-manager";
import { expandDataWithNewIds } from "noco-lib/universal/expander";
import { ExpandedDataWithBlock } from "noco-lib/universal/types";
import { NocoErrorViewFactory } from "noco-lib/editing/noco-error-view";
export const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const componentRegistry = new ComponentRegistry(
  NocoErrorViewFactory("ComponentRegistry", "Loading", true),
  NocoErrorViewFactory("ComponentRegistry", "Loading", true)
);

componentRegistry.addRegistry("pageTemplates", pageTemplates);
componentRegistry.addRegistry("sections", sectionMap);
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
        <editingDataProviderContext.Provider
          value={dataManager}
        ></editingDataProviderContext.Provider>
      </componentRegistryContext.Provider>
    </div>
  );
}
