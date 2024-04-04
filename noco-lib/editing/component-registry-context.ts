import React from "react";
import { ComponentRegistry } from "./component-registry";

export const componentRegistryContext = React.createContext<
  ComponentRegistry | undefined
>(undefined);

export const useComponentRegistry = () => {
  const registry = React.useContext(componentRegistryContext);
  if (!registry) {
    throw new Error(
      "useComponentRegistry must be used within a ComponentRegistryProvider"
    );
  }
  return registry;
};
