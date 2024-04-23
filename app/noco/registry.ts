import { ComponentRegistry } from "noco-lib/editing/component-registry";
import { pageTemplates } from "~/noco/page-templates";
import { sections } from "~/noco/sections";
import { systemErrors } from "noco-lib/editing/noco-error-view";

export const registry = new ComponentRegistry();

registry.registerAll(systemErrors);
registry.registerAll(pageTemplates);
registry.registerAll(sections);
