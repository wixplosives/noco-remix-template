import { createBoard } from "@wixc3/react-board";
import { useNocoEditView } from "../../../../noco-lib/editing/noco-edit-view";
import { GUID } from "noco-lib/universal/types";
import {
  NocoEditingPages,
  editingDataProviderContext,
} from "noco-lib/editing/editing-data-manager";
import { componentRegistryContext } from "noco-lib/editing/component-registry-context";
import React from "react";
import { fetchPage, fetchPageList } from "data-mocks/apis";
import schema from "../../../../app/noco/page.schema.json";
import { registry } from "../../../../app/noco/registry";

const dataManager = new NocoEditingPages(
  fetchPageList,
  fetchPage,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema as any
);

const BoardPlugin = {
  plugin: {
    wrapRender(
      _props: unknown,
      _renderable: unknown,
      renderableElement: JSX.Element
    ) {
      return (
        <componentRegistryContext.Provider value={registry}>
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

const deserialize = function <P>(
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
  //   const res = createElementByOtherName(CompType as any, { ...props, key });
  // const Comp = Page;
  // const res = <Comp {...props} key={key} />;
  // return res;
  const res = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...createElementByOtherName(Page as any, { ...props, key }),
  };

  return res;
};

const createElementByOtherName = React.createElement.bind(React);
export default createBoard({
  name: "NocoPages",
  Board: () => {
    const res = useNocoEditView(deserialize);
    return res;
  },
  isSnippet: true,
  plugins: [BoardPlugin.use()],
  environmentProps: {
    canvasHeight: 216,
    canvasWidth: 248,
  },
});
