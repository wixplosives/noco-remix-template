import React, { useCallback } from "react";
import { editingDataProviderContext } from "./editing-data-manager";
import { useAsync } from "./use-async";

export const usePage = (pageId?: string, setAsCurrent = false) => {
  const dataManager = React.useContext(editingDataProviderContext);
  if (!dataManager) {
    throw new Error("No data manager found");
  }

  return useAsync(
    useCallback(
      () =>
        pageId
          ? dataManager.getPage(pageId, setAsCurrent)
          : Promise.resolve(null),
      [dataManager, pageId, setAsCurrent]
    )
  );
};
