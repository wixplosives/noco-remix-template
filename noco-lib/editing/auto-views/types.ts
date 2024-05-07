import {
  DataChangeCategory,
  ExpandedData,
  GUID,
  NocoBaseChange,
  NocoChange,
} from "noco-lib/universal/types";
import { CoreSchemaMetaSchema } from "./JSONSchema";
export interface Metadata {
  [pointer: string]: unknown;
}
export type AutoEventHandler<TEvent extends AutoEvent = AutoEvent> = (
  e: unknown,
  autoEvent: TEvent
) => void;

export interface AutoEvent {
  schemaPointer: string;
}
export interface ValidationError {
  data: unknown;
  schema: CoreSchemaMetaSchema;
  keyword: string;
  message: string;
  dataPointer: string;
  schemaPointer: string;
}
export interface AutoCustomEvent<
  Name extends string = string,
  Data extends ExpandedData = ExpandedData
> extends AutoEvent {
  name: Name;
  data: Data;
}

export interface AutoViewSetNewChange
  extends NocoBaseChange<DataChangeCategory> {
  kind: "set-new";
  params: {
    newValue: ExpandedData;
  };
}

export type AutoViewChange = NocoChange | AutoViewSetNewChange;

export interface AutoChangeEvent extends AutoEvent {
  patch: AutoViewChange[];
}
export interface AutoClickEvent extends AutoEvent {
  data?: unknown;
}
export interface AutoViewProps<Data extends ExpandedData = ExpandedData> {
  key?: string;
  schema: CoreSchemaMetaSchema;
  validation?: boolean;
  data?: Data;
  metadata?: Metadata;
  dataId: GUID;
  schemaPointer: string;
  pick?: string[];
  omit?: string[];
  onCustomEvent?: AutoEventHandler<AutoCustomEvent>;
  onChange?: AutoEventHandler<AutoChangeEvent>;
  onClick?: AutoEventHandler<AutoClickEvent>;
  onError?: (error: ValidationError) => void;
  onRenderError?: (info: RenderErrorInfo) => void;
  repositoryName?: string;
  field?: string;
  depth?: number;
}

export interface RenderErrorInfo {
  message: string;
  stack?: string;
  componentStack: string;
  props: unknown;
}

export type SimpleTypes =
  | "array"
  | "boolean"
  | "null"
  | "number"
  | "object"
  | "string";
