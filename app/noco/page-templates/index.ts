import { ComponentRegistryMap } from "noco-lib/editing/component-registry";

export const pageTemplates: ComponentRegistryMap = new Map([
  [
    "defaultPageTemplate",
    async () => (await import("./default-page-template")).DefaultPageTemplate,
  ],
]);
