import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  isExpandedDataWithBlock,
  type ExpandedData,
  type ExpandedDataWithBlock,
  GUID,
} from "../universal/types";
import { usePage } from "./use-page";
import { useComponentRegistry } from "./component-registry-context";
import {
  NocoNavigationEvent,
  editingDataProviderContext,
} from "./editing-data-manager";
import React from "react";

// class NocoReactRenderer {
//   constructor(private data: ExpandedDataWithBlock) {}
//   render(): JSX.Element | null {
//     return null;
//   }
// }

// function intoLazyComponent(promise: Promise<React.ComponentType<unknown>>) {
//   const LazyComponentLoader = lazy(async () => {
//     return { default: await promise };
//   });
//   return LazyComponentLoader;
// }

export const useNocoEditView = <U,>(
  toJsx: <P>(
    compType: React.ComponentType<P>,
    props: P,
    key: GUID,
    isRoot: boolean
  ) => U
) => {
  const dataManager = React.useContext(editingDataProviderContext);
  if (!dataManager) {
    throw new Error("No data manager found");
  }
  const [currrentPage, setCurrentPage] = useState<string>("/");

  const page = usePage(currrentPage);
  const [ver, onComponentLoaded] = useReducer((state) => state + 1, 0);
  const loadingComponents = useRef(new Set<string>());
  const componentRegistry = useComponentRegistry();

  useEffect(() => {
    const handlePageChange = (e: Event) => {
      if (e instanceof NocoNavigationEvent) {
        setCurrentPage(e.slug);
      }
    };
    window.document.addEventListener("noco-navigation", handlePageChange);
    return () => {
      window.document.removeEventListener("noco-navigation", handlePageChange);
    };
  }, []);

  useEffect(() => {
    window.document.dispatchEvent(new CustomEvent("noco-render"));
  }, [ver, page]);
  const deserializedPage = useMemo(() => {
    if (!page) {
      return null;
    }
    const deps = new Set(getDeserializeDependencies(page));
    for (const dep of deps) {
      if (
        !componentRegistry.getComponentById(dep) &&
        !loadingComponents.current.has(dep)
      ) {
        loadingComponents.current.add(dep);
        componentRegistry.loadComponentById(dep).then(onComponentLoaded);
      }
    }
    return mapToEditView(page, (data, deserialize) => {
      const componentType = data.value.__noco__type__.value;
      const ComponentDriver = componentRegistry.getDriverById(componentType);
      const Component = componentRegistry.getComponentById(componentType);
      if (ComponentDriver.componentLoadError) {
        return toJsx(
          componentRegistry.getErrorView(),
          {
            message:
              "Component " + ComponentDriver.id + " failed to load" + ver,
          },
          data.id,
          page.value.props === data.value.props
        );
      }
      if (Component === null || Component === undefined) {
        return toJsx(
          componentRegistry.getErrorView(),
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

function getDeserializeDependencies(data: ExpandedData): string[] {
  if (!data) {
    return [];
  }
  if (isExpandedDataWithBlock(data)) {
    return [
      data.value.__noco__type__.value,
      ...Object.values(data.value.props.value).flatMap(
        getDeserializeDependencies
      ),
    ];
  }
  if (data.value === null) {
    return [];
  }
  if (Array.isArray(data.value)) {
    return data.value.flatMap(getDeserializeDependencies);
  }
  if (typeof data.value === "object") {
    return Object.values(data.value).flatMap(getDeserializeDependencies);
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
