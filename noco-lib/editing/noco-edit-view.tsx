import { useCallback, useContext, useMemo, useReducer } from "react";
import {
  isExpandedDataWithBlock,
  type ExpandedData,
  type ExpandedDataWithBlock,
  GUID,
} from "../universal/types";
import { usePage } from "./use-page";
import { componentRegistryContext } from "./use-component";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useNocoEditView = <U,>(
  toJsx: <P>(
    compType: React.ComponentType<P>,
    props: P,
    key: GUID,
    isRoot: boolean
  ) => U
) => {
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
        return toJsx(
          componentRegistry.LoadingView,
          { message: "Loading" + ver },
          data.id,
          page.value.props === data.value.props
        );
      }
      const props = Object.entries(data.value.props.value).reduce(
        (acc, [key, value]) => {
          acc[key] = deserialize(value);
          return acc;
        },
        {} as Record<string, unknown>
      );
      return toJsx(
        Component,
        props,
        data.id,
        page.value.props === data.value.props
      );
    });
  }, [componentRegistry, page, toJsx, ver]);

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

export const NocoEditView = () => {
  const deserialize = useCallback(function <P>(
    CompType: React.ComponentType<P>,
    props: P,
    key: GUID
  ) {
    return <CompType {...props} key={key} />;
  },
  []);
  const res = useNocoEditView(deserialize);
  return res;
};
