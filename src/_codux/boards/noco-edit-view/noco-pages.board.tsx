import { createBoard } from "@wixc3/react-board";
import { NocoEditView } from "../../../../noco-lib/editing/noco-edit-view";
import { ComponentRegistry } from "noco-lib/editing/component-registry";
import { pageTemplates } from "~/noco/page-templates";
import { sectionMap } from "~/noco/sections";
import { expandDataWithNewIds } from "noco-lib/universal/expander";
import pageList from "../../../../data-mocks/page-list.json";
import homeData from "../../../../data-mocks/home.json";
import { ExpandedDataWithBlock } from "noco-lib/universal/types";
import {
  EditingDataManager,
  editingDataProviderContext,
} from "noco-lib/editing/editing-data-manager";
import { componentRegistryContext } from "noco-lib/editing/use-component";
const componentRegistry = new ComponentRegistry();

componentRegistry.addRegistry("pageTemplates", pageTemplates);
componentRegistry.addRegistry("sections", sectionMap);
const fetchPageList = async () => expandDataWithNewIds(pageList);
const fetchPage = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = homeData as any;
  return expandDataWithNewIds(data) as unknown as ExpandedDataWithBlock;
};
const dataManager = new EditingDataManager(fetchPageList, fetchPage);

export default createBoard({
  name: "NocoPages",
  Board: () => (
    <componentRegistryContext.Provider value={componentRegistry}>
      <editingDataProviderContext.Provider value={dataManager}>
        <NocoEditView />
      </editingDataProviderContext.Provider>
    </componentRegistryContext.Provider>
  ),
  isSnippet: true,
});
