// import { v4 as uuid } from 'uuid';

export type GUID<T extends DataChangeCategory = DataChangeCategory> = string & {
  __guid: true;
  __kind: T;
};

export const generateGUID = <T extends DataChangeCategory>(
  _forKind: T
): GUID<T> => {
  return Math.random().toString(36).slice(2) as GUID<T>;
};

export type DataChangeCategory = "primitive" | "object" | "array";

export type ExpandedDataValueContstraints =
  | string
  | number
  | boolean
  | null
  | undefined
  | ExpandedData[]
  | Record<string, ExpandedData>
  | Record<never, never>;

export interface ExpandedData<
  V extends ExpandedDataValueContstraints = ExpandedDataValueContstraints
> {
  value: V;
  id: GUID;
}

export interface BlockData {
  type: string;
  props: { [key: string]: unknown };
}

export type ToExpandedData<T> = T extends
  | string
  | number
  | boolean
  | null
  | undefined
  ? ExpandedData<T>
  : T extends Array<infer U>
  ? ExpandedData<ToExpandedData<U>[]>
  : T extends object
  ? ExpandedData<{
      [K in keyof T]: ToExpandedData<T[K]>;
    }>
  : never;

export interface ExpandedDataWithBlock {
  value: {
    type: ExpandedData<string>;
    props: Record<string, ExpandedData>;
  };
  id: GUID;
}

export interface NocoBaseChange<T extends DataChangeCategory> {
  target: GUID<T>;
  kind: string;
  params: Record<string, unknown>;
}

export interface NocoSetChange extends NocoBaseChange<DataChangeCategory> {
  kind: "set";
  params: {
    newValue: ExpandedData;
  };
}

export interface NodeSetPropertyChange extends NocoBaseChange<"object"> {
  kind: "setProperty";
  params: {
    propertyName: string;
    newValue: ExpandedData;
  };
}

export interface NocoRemovePropertyChange extends NocoBaseChange<"object"> {
  kind: "removeProperty";
  params: {
    propertyName: string;
  };
}

export interface NocoAddItemChange extends NocoBaseChange<"array"> {
  kind: "addItem";
  params: {
    beforeItemId: GUID;
    newValue: ExpandedData;
  };
}
export interface NocoRemoveItemChange extends NocoBaseChange<"array"> {
  kind: "removeItem";
  params: {
    itemId: GUID;
  };
}