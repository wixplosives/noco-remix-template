import React from "react";
import { editingDataProviderContext } from "./editing-data-manager";
import { useAsync } from "./use-async";

export const usePageList = () => {
  const dataManager = React.useContext(editingDataProviderContext);
  if (!dataManager) {
    throw new Error("No data manager found");
  }
  return useAsync(dataManager.getPageList);
};
