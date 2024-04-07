import pageList from "./page-list.json";
import homeData from "./home.json";
import aboutData from "./about.json";
import { expandDataWithNewIds } from "noco-lib/universal/expander";
import { ExpandedDataWithBlock, NocoPageList } from "noco-lib/universal/types";

export const fetchPageList = async () =>
  expandDataWithNewIds(pageList) as unknown as NocoPageList;
export const fetchPage = async (pageId: string) => {
  const data = pageId === "./about.json" ? aboutData : homeData;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return expandDataWithNewIds(data as any) as unknown as ExpandedDataWithBlock;
};
