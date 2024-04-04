import { ExpandedData, ExpandedDataWithBlock } from "noco-lib/universal/types";
import React from "react";

export class EditingDataManager {
  constructor(
    private fetchPageList: () => Promise<ExpandedData>,
    private fetchPage: (id: string) => Promise<ExpandedDataWithBlock>
  ) {}
  private documentList: ExpandedData | null = null;
  private docListPromise: Promise<ExpandedData> | null = null;
  private documents: Map<string, ExpandedDataWithBlock> = new Map();
  private documentPromises: Map<string, Promise<ExpandedDataWithBlock>> =
    new Map();

  getLoadedPageList(): ExpandedData | null {
    return this.documentList;
  }
  getPageList = (): Promise<ExpandedData> => {
    if (!this.documentList) {
      if (this.docListPromise) {
        return this.docListPromise;
      }
      const res = this.fetchPageList().then((data) => {
        this.documentList = data;
        return data;
      });
      this.docListPromise = res;
      return res;
    }
    return Promise.resolve(this.documentList);
  };

  getLoadedPage(id: string): ExpandedDataWithBlock | null {
    return this.documents.get(id) || null;
  }

  getPage(id: string): Promise<ExpandedDataWithBlock> {
    if (!this.documents.has(id)) {
      if (this.documentPromises.has(id)) {
        return this.documentPromises.get(id)!;
      }
      const res = this.fetchPage(id).then((data) => {
        this.documents.set(id, data);
        return data;
      });
      this.documentPromises.set(id, res);
      return res;
    }
    return Promise.resolve(this.documents.get(id)!);
  }
}

export const editingDataProviderContext =
  React.createContext<EditingDataManager | null>(null);
