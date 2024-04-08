import { ComponentDriver } from "noco-lib/editing/component-registry";

export const sections: ComponentDriver[] = [
  {
    id: "hero",
    type: "section",
    loadComponent: async () => (await import("./hero")).Hero,
  },
  {
    id: "gallery",
    type: "section",
    loadComponent: async () => (await import("./gallery")).Gallery,
  },
];
