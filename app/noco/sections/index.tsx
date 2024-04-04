import { ComponentRegistryMap } from "noco-lib/editing/component-registry";

export const sectionMap: ComponentRegistryMap = new Map();
sectionMap.set("hero", async () => (await import("./hero")).Hero);
sectionMap.set("gallery", async () => (await import("./gallery")).Gallery);
