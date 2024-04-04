import {
  type ExpandedDataValueContstraints,
  type ExpandedData,
  type ToExpandedData,
  generateGUID,
} from "./types";

export function expandDataWithNewIds<T extends ExpandedDataValueContstraints>(
  data: ExpandedDataValueContstraints
): ToExpandedData<T> {
  if (data === null || data === undefined) {
    return {
      value: data,
      id: generateGUID("primitive"),
    } as ToExpandedData<T>;
  }
  if (Array.isArray(data)) {
    return {
      value: data.map(expandDataWithNewIds),
      id: generateGUID("array"),
    } as ToExpandedData<T>;
  }
  if (typeof data === "object") {
    const result: Record<string, ExpandedData> = {};
    for (const key in data) {
      result[key] = expandDataWithNewIds(
        (data as Record<string, ExpandedData>)[key]
      );
    }
    return {
      value: result,
      id: generateGUID("object"),
    } as ToExpandedData<T>;
  }
  return {
    value: data,
    id: generateGUID("primitive"),
  } as ToExpandedData<T>;
}
