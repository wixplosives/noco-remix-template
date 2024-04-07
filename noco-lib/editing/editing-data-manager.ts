import { ExpandedDataWithBlock, NocoPageList } from "noco-lib/universal/types";
import React from "react";

export class EditingDataManager {
  constructor(
    private fetchPageList: () => Promise<NocoPageList>,
    private fetchPage: (id: string) => Promise<ExpandedDataWithBlock>
  ) {
    if (typeof window !== "undefined") {
      this.initNavigationBlock();
      window.document.dispatchEvent(new NocoEvent("on-noco-preview", this));
    }
  }
  private documentList: NocoPageList | null = null;
  private docListPromise: Promise<NocoPageList> | null = null;
  private documents: Map<string, ExpandedDataWithBlock> = new Map();
  private documentPromises: Map<string, Promise<ExpandedDataWithBlock>> =
    new Map();

  getLoadedPageList(): NocoPageList | null {
    return this.documentList;
  }
  getPageList = (): Promise<NocoPageList> => {
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
    return Promise.resolve(this.documentList).then((data) => {
      return data;
    });
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

  public async gotoPageBySlug(pageSlug: string) {
    const pages = await this.getPageList();
    const page = pages.value.pages.value.find(
      (p) => p.value.slug.value === pageSlug
    );
    if (page) {
      this.gotoPage(page.value.pageID.value);
    }
  }
  public async gotoPage(pageId: string) {
    window.document.dispatchEvent(
      new NocoNavigationEvent("noco-navigation", pageId)
    );
  }

  private initNavigationBlock() {
    window.document.addEventListener("noco-render", () => {
      this.blockNavigation();
    });
  }
  private blockNavigation() {
    const allLinks = document.querySelectorAll("a");
    allLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.gotoPageBySlug(link.getAttribute("href")!);
      });
    });
  }
}

export const editingDataProviderContext =
  React.createContext<EditingDataManager | null>(null);

export class NocoEvent extends Event {
  constructor(type: string, public dataManager: EditingDataManager) {
    super(type);
  }
}

export class NocoNavigationEvent extends Event {
  constructor(type: string, public slug: string) {
    super(type);
  }
}

export class NocoRenderEvent extends Event {
  constructor(type: string) {
    super(type);
  }
}
