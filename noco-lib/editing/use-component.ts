import React from "react";
import { ComponentRegistry } from "./component-registry";
import { NocoErrorViewFactory } from "./noco-error-view";

export const componentRegistryContext = React.createContext<ComponentRegistry>(
  new ComponentRegistry()
);

export const useComponent = (categoryName: string, name: string) => {
  const registry = React.useContext(componentRegistryContext);
  const [_loadingStatus, setLoadingStatus] = React.useState<
    "loading" | "loaded" | "error"
  >("loading");
  const loadingPromiseRef = React.useRef<Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.ComponentType<any>
  > | null>(null);
  const loadedComponent = registry.getComponentIfLoaded(categoryName, name);
  if (loadedComponent) {
    return loadedComponent;
  }
  if (loadingPromiseRef.current) {
    return null;
  }
  loadingPromiseRef.current = registry
    .loadComponent(categoryName, name)
    .then((component) => {
      setLoadingStatus("loaded");
      return component;
    })
    .catch(() => {
      setLoadingStatus("error");
      return NocoErrorViewFactory(categoryName, name, true);
    });
  return null;
};
