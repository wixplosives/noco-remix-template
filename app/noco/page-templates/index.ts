import { ComponentDriver } from "noco-lib/editing/component-registry";

export const pageTemplates: ComponentDriver[] = [
  {
    id: "defaultPageTemplate",
    type: "pageTemplate",
    loadComponent: async () =>
      (await import("./default-page-template")).DefaultPageTemplate,
  },
];
