import React, { useCallback } from "react";
import { useAsync } from "./use-async";
import { useComponentRegistry } from "./component-registry-context";

export const useComponent = (id: string): React.ComponentType | undefined => {
  const registry = useComponentRegistry();

  const load = useCallback(async () => {
    const loadedComponent = registry.getComponentById(id);
    if (loadedComponent) {
      return loadedComponent;
    }
    try {
      return registry.loadComponentById(id);
    } catch (e) {
      const LoadingError = () =>
        React.createElement(registry.getErrorView(), {
          message: String(e),
        });
      return LoadingError;
    }
  }, [id, registry]);

  return useAsync(load) || undefined;
};
