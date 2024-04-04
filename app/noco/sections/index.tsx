import { ComponentDriver } from "noco-lib/editing/component-registry";

export const sections: ComponentDriver[] = [
  {
    id: "sections/hero",
    type: "section",
    loadComponent: async () => (await import("./hero")).Hero,
  },
  {
    id: "sections/gallery",
    type: "section",
    loadComponent: async () => (await import("./gallery")).Gallery,
  },
];
