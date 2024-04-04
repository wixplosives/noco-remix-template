import { useContext, useMemo, useReducer } from "react";
import {
  isExpandedDataWithBlock,
  type ExpandedData,
  type ExpandedDataWithBlock,
} from "../universal/types";
import { usePage } from "./use-page";
import { componentRegistryContext } from "./use-component";

export const NocoEditView = () => {
  const page = usePage("a");
  const [ver, onComponentLoaded] = useReducer((state) => state + 1, 0);
  const componentRegistry = useContext(componentRegistryContext);

  const deserializedPage = useMemo(() => {
    const deps = new Set(getDeserialieDependecies(page));
    for (const dep of deps) {
      const [category, name] = dep.split("/");
      if (!componentRegistry.getComponentIfLoaded(category, name)) {
        componentRegistry.loadComponent(category, name).then(onComponentLoaded);
      }
    }
    return mapToEditView(page, (data, deserialize) => {
      const componentType = data.value.__noco__type__.value;
      const [category, name] = componentType.split("/");
      const Component = componentRegistry.getComponentIfLoaded(category, name);
      if (Component === null || Component === undefined) {
        return <div>Loading...{ver}</div>;
      }
      const props = Object.entries(data.value.props.value).reduce(
        (acc, [key, value]) => {
          acc[key] = deserialize(value);
          return acc;
        },
        {} as Record<string, unknown>
      );
      return <Component {...props} />;
    });
  }, [componentRegistry, onComponentLoaded, page, ver]);

  return deserializedPage as JSX.Element | null;
};

function getDeserialieDependecies(data: ExpandedData): string[] {
  if (!data) {
    return [];
  }
  if (isExpandedDataWithBlock(data)) {
    return [
      data.value.__noco__type__.value,
      ...Object.values(data.value.props.value).flatMap(
        getDeserialieDependecies
      ),
    ];
  }
  if (data.value === null) {
    return [];
  }
  if (Array.isArray(data.value)) {
    return data.value.flatMap(getDeserialieDependecies);
  }
  if (typeof data.value === "object") {
    return Object.values(data.value).flatMap(getDeserialieDependecies);
  }
  return [];
}
function mapToEditView(
  data: ExpandedData,
  deserialize: (
    data: ExpandedDataWithBlock,
    mapToEditView: (data: ExpandedData) => unknown
  ) => unknown
) {
  if (!data) {
    return null;
  }
  const boundToDeserialize = (data: ExpandedData): unknown =>
    mapToEditView(data, deserialize);

  if (isExpandedDataWithBlock(data)) {
    return deserialize(data, boundToDeserialize);
  }
  if (data.value === null) {
    return null;
  }
  if (Array.isArray(data.value)) {
    return data.value.map(boundToDeserialize);
  }
  if (typeof data.value === "object") {
    const result: Record<string, unknown> = {};
    for (const key in data.value) {
      result[key] = boundToDeserialize(
        (data.value as Record<string, ExpandedData>)[key]
      );
    }
    return result;
  }
  return data.value;
}
