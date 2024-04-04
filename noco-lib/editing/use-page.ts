import React, { useCallback } from "react";
import { editingDataProviderContext } from "./editing-data-manager";
import { useAsync } from "./use-async";

export const usePage = (pageId: string) => {
  const dataManager = React.useContext(editingDataProviderContext);
  if (!dataManager) {
    throw new Error("No data manager found");
  }

  return useAsync(
    useCallback(() => dataManager.getPage(pageId), [dataManager, pageId])
  );
};
