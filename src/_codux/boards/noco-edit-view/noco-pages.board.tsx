import { createBoard } from "@wixc3/react-board";
import { useNocoEditView } from "../../../../noco-lib/editing/noco-edit-view";
import { ComponentRegistry } from "noco-lib/editing/component-registry";
import { pageTemplates } from "~/noco/page-templates";
import { sections } from "~/noco/sections";
import { GUID } from "noco-lib/universal/types";
import {
  EditingDataManager,
  editingDataProviderContext,
} from "noco-lib/editing/editing-data-manager";
import { componentRegistryContext } from "noco-lib/editing/component-registry-context";
import React, { useCallback } from "react";
import { systemErrors } from "noco-lib/editing/noco-error-view";
import { fetchPage, fetchPageList } from "data-mocks/apis";
import schema from "../../../../app/noco/page.schema.json";
const componentRegistry = new ComponentRegistry();
componentRegistry.registerAll(systemErrors);
componentRegistry.registerAll(pageTemplates);
componentRegistry.registerAll(sections);

const BoardPlugin = {
  plugin: {
    wrapRender(
      _props: unknown,
      _renderable: unknown,
      renderableElement: JSX.Element
    ) {
      return (
        <componentRegistryContext.Provider value={componentRegistry}>
          <editingDataProviderContext.Provider value={dataManager}>
            {renderableElement}
          </editingDataProviderContext.Provider>
        </componentRegistryContext.Provider>
      );
    },
  },
  defaultProps: {},
  merge() {
    return [];
  },
  pluginName: "NocoPages",
  use() {
    return {
      key: BoardPlugin,
      props: {},
    };
  },
};

type windowWithEditingDataManager = typeof window & {
  _editingDataManager: EditingDataManager;
};
const dataManager =
  (window as windowWithEditingDataManager)._editingDataManager ||
  new EditingDataManager(
    fetchPageList,
    fetchPage,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema as any
  );

(window as windowWithEditingDataManager)._editingDataManager = dataManager;
dataManager.onReload();
const createElementByOtherName = React.createElement.bind(React);
export default createBoard({
  name: "NocoPages",
  Board: () => {
    const deserialize = useCallback(function <P>(
      Page: React.ComponentType<P>,
      props: P,
      key: GUID,
      isRoot: boolean
    ) {
      if (isRoot) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return <Page {...props} key={key} />;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = createElementByOtherName(Page as any, { ...props, key });
      // const Comp = Page;
      // const res = <Comp {...props} key={key} />;
      // return res;
      // const res = {
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //   ...createElementByOtherName(Page as any, { ...props, key }),
      // };

      return res;
    },
    []);
    const res = useNocoEditView(deserialize);
    return res;
  },
  isSnippet: true,
  plugins: [BoardPlugin.use()],
  environmentProps: {
    canvasHeight: 216,
    canvasWidth: 344,
    windowWidth: 1152,
  },
});
