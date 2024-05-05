import {
  ExpandedData,
  ExpandedDataValueConstraints,
  NocoChange,
} from "noco-lib/universal/types";

export const NocoReducer = <T>(base: T, change: NocoChange): T => {
  if (base === null) {
    throw new Error("Base is null");
  }
  const changed = visitAndBreak(base as ExpandedData, (data, breakSignal) => {
    if (data.id === change.target) {
      breakSignal();

      switch (change.kind) {
        case "set":
          return {
            id: data.id,
            value: change.params.newValue as ExpandedDataValueConstraints,
          };

        case "setProperty": {
          if (typeof data.value === "object" && data.value !== null) {
            const objectValue = data.value as Record<string, ExpandedData>;
            return {
              id: data.id,
              value: {
                ...objectValue,
                [change.params.propertyName]: change.params.newValue,
              },
            };
          }
          return data;
        }
        case "removeProperty": {
          if (typeof data.value === "object" && data.value !== null) {
            const objectValue = data.value as Record<string, ExpandedData>;
            const { [change.params.propertyName]: _, ...rest } = objectValue;
            return {
              id: data.id,
              value: rest,
            };
          }
          return data;
        }
        case "addItem": {
          if (Array.isArray(data.value)) {
            const arrayValue = data.value as ExpandedData[];
            if (!change.params.beforeItemId) {
              return {
                id: data.id,
                value: [...arrayValue, change.params.newValue],
              };
            }
            const index = arrayValue.findIndex(
              (item) => item.id === change.params.beforeItemId
            );
            if (index === -1) {
              return data;
            }
            const newArray = [...arrayValue];
            newArray.splice(index, 0, change.params.newValue);
            return {
              id: data.id,
              value: newArray,
            };
          }
          return data;
        }
        case "removeItem": {
          if (Array.isArray(data.value)) {
            const arrayValue = data.value as ExpandedData[];
            const index = arrayValue.findIndex(
              (item) => item.id === change.params.itemId
            );
            if (index === -1) {
              return data;
            }
            const newArray = [...arrayValue];
            newArray.splice(index, 1);
            return {
              id: data.id,
              value: newArray,
            };
          }
          return data;
        }
      }
    }
    return data;
  });

  return changed as T;
};

export function visitAndBreak(
  content: ExpandedData,
  visitor: (
    data: ExpandedData,
    breakSignal: () => void,
    parents: ExpandedData[]
  ) => ExpandedData,
  parents: ExpandedData[] = []
): ExpandedData {
  let breakSignal = false;
  const breakFunction = () => {
    breakSignal = true;
  };
  if (typeof content.value === "object" && content.value !== null) {
    if (Array.isArray(content.value)) {
      let changed = false;
      const res: ExpandedData = {
        id: content.id,
        value: [],
      };
      const newParents = [...parents, content];
      for (let i = 0; i < content.value.length; i++) {
        if (breakSignal) {
          (res.value as ExpandedData[]).push(content.value[i]);
        } else {
          const propValue = visitAndBreak(
            content.value[i],
            visitor,
            newParents
          );
          if (propValue !== content.value[i]) {
            changed = true;
          }
          (res.value as ExpandedData[]).push(propValue);
        }
      }
      const afterChildVisit = changed ? res : content;
      return visitor(afterChildVisit, breakFunction, parents);
    } else {
      const res: ExpandedData = {
        id: content.id,
        value: {},
      };
      let changed = false;
      const newParents = [...parents, content];
      for (const key in content.value) {
        const objectValue = content.value as Record<string, ExpandedData>;
        if (breakSignal) {
          (res.value as Record<string, ExpandedData>)[key] = objectValue[key];
        } else {
          const propValue = visitAndBreak(
            objectValue[key],
            visitor,
            newParents
          );
          if (propValue !== objectValue[key]) {
            changed = true;
          }
          (res.value as Record<string, ExpandedData>)[key] = propValue;
        }
      }
      const afterChildVisit = changed ? res : content;
      return visitor(afterChildVisit, breakFunction, parents);
    }
  }

  const result = visitor(content, breakFunction, parents);
  if (breakSignal) {
    return result;
  }
  return {
    id: content.id,
    value: result.value,
  };
}
