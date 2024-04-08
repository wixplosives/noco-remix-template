import React, { useCallback, useEffect, useState } from "react";
import { editingDataProviderContext } from "./editing-data-manager";
import { useAsync } from "./use-async";
import { ExpandedDataWithBlock } from "noco-lib/universal/types";

export const usePage = (pageId?: string, setAsCurrent = false) => {
  const dataManager = React.useContext(editingDataProviderContext);
  if (!dataManager) {
    throw new Error("No data manager found");
  }
  const [pageState, updatePage] = useState<{
    data: ExpandedDataWithBlock;
    id: string;
  } | null>(null);
  useEffect(() => {
    const updateListener = () => {
      if (pageId) {
        const page = dataManager.getLoadedPage(pageId);
        if (page && page !== pageState?.data) {
          updatePage({
            data: page,
            id: pageId,
          });
        }
      }
    };
    window.document.addEventListener("noco-update", updateListener);
    return () => {
      window.document.removeEventListener("noco-update", updateListener);
    };
  }, [dataManager, pageId, pageState]);
  const initialValue = useAsync(
    useCallback(
      () =>
        pageId
          ? dataManager.getPage(pageId, setAsCurrent)
          : Promise.resolve(null),
      [dataManager, pageId, setAsCurrent]
    )
  );

  return pageState?.id === pageId
    ? pageState?.data || initialValue
    : initialValue;
};
