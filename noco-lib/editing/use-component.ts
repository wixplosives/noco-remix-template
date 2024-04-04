import React, { useCallback } from "react";
import { ComponentRegistry } from "./component-registry";
import { NocoErrorViewFactory } from "./noco-error-view";
import { useAsync } from "./use-async";

export const componentRegistryContext = React.createContext<ComponentRegistry>(
  new ComponentRegistry(
    NocoErrorViewFactory("ComponentRegistry", "Loading", true),
    NocoErrorViewFactory("ComponentRegistry", "Loading", true)
  )
);

export const useComponent = (
  categoryName: string,
  name?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.ComponentType<any> | null => {
  const registry = React.useContext(componentRegistryContext);

  return useAsync(
    useCallback(() => {
      const loadedComponent =
        name && registry.getComponentIfLoaded(categoryName, name);
      if (loadedComponent) {
        return loadedComponent;
      }
      if (!name) {
        return NocoErrorViewFactory(categoryName, "Loading", true);
      }
      return registry.loadComponent(categoryName, name);
    }, [categoryName, name, registry])
  );
};
