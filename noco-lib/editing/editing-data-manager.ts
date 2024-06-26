import { ExpandedDataWithBlock, NocoPageList } from "noco-lib/universal/types";
import React from "react";
import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

export class EditingDataManager {
  constructor(
    private fetchPageList: () => Promise<NocoPageList>,
    private fetchPage: (id: string) => Promise<ExpandedDataWithBlock>,
    private pageSchema: JSONSchema4
  ) {
    if (typeof window !== "undefined") {
      this.initNavigationBlock();
      window.document.dispatchEvent(new NocoEvent("on-noco-preview", this));
    }
  }
  private documentList: NocoPageList | null = null;
  private docListPromise: Promise<NocoPageList> | null = null;
  private documents: Map<string, ExpandedDataWithBlock> = new Map();
  private currentPageId: string | null = null;
  private documentPromises: Map<string, Promise<ExpandedDataWithBlock>> =
    new Map();

  public onReload() {
    window.document.dispatchEvent(new NocoEvent("on-noco-preview", this));
  }
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

  setPageData(id: string, data: ExpandedDataWithBlock) {
    this.documents.set(id, data);
    window.document.dispatchEvent(new Event("noco-update"));
  }

  getPage(id: string, setAsCurrent = false): Promise<ExpandedDataWithBlock> {
    if (!this.documents.has(id)) {
      if (this.documentPromises.has(id)) {
        return this.documentPromises.get(id)!;
      }
      const res = this.fetchPage(id).then((data) => {
        this.documents.set(id, data);
        if (setAsCurrent) {
          this.gotoPage(id);
        }
        return data;
      });
      this.documentPromises.set(id, res);
      return res;
    }
    return Promise.resolve(this.documents.get(id)!);
  }
  public getSchema() {
    return this.pageSchema;
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
  public getCurrentPageId() {
    return this.currentPageId;
  }

  public gotoPage(pageId: string) {
    this.currentPageId = pageId;

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
    allLinks.forEach(this.linkBlocker);
  }
  private linkBlocker = (link: HTMLAnchorElement) => {
    if (!link.href) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((link as any).nocoLinkBlocked) {
      return;
    }
    const listener = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const href = link.getAttribute("href");
      if (!href) return;
      this.gotoPageBySlug(href);
    };
    link.addEventListener("click", listener);
    // link.addEventListener("mousedown", listener);
    // link.addEventListener("navigation", listener);
  };
}

export const editingDataProviderContext =
  React.createContext<EditingDataManager | null>(null);

export class NocoEvent extends Event {
  constructor(type: string, public dataManager: EditingDataManager) {
    super(type);
  }
}

export class NocoNavigationEvent extends Event {
  constructor(type: string, public pageId: string) {
    super(type);
  }
}

export class NocoRenderEvent extends Event {
  constructor(type: string) {
    super(type);
  }
}
