/* eslint-disable @typescript-eslint/no-explicit-any */
import { NocoErrorViewFactory } from "./noco-error-view";

export type ComponentRegistryMap = Map<
  string,
  () => Promise<React.ComponentType<any>>
>;

export class ComponentRegistry {
  private registry: Map<string, ComponentRegistryMap> = new Map();
  private loadedComponents: Map<
    string,
    Map<string, React.ComponentType<unknown>>
  > = new Map();
  private loadingComponents: Map<
    string,
    Map<string, Promise<React.ComponentType<unknown>>>
  > = new Map();
  addRegistry(key: string, registry: ComponentRegistryMap): void {
    this.registry.set(key, registry);
  }
  getComponentIfLoaded(
    category: string,
    name: string
  ): React.ComponentType<any> | undefined {
    return this.loadedComponents.get(category)?.get(name);
  }

  async loadComponent(
    category: string,
    name: string
  ): Promise<React.ComponentType<unknown>> {
    if (
      this.loadedComponents.has(category) &&
      this.loadedComponents.get(category)!.has(name)
    ) {
      return this.loadedComponents.get(category)!.get(name)!;
    }
    if (
      this.loadingComponents.has(category) &&
      this.loadingComponents.get(category)!.has(name)
    ) {
      return this.loadingComponents.get(category)!.get(name)!;
    }
    const registry = this.registry.get(category);
    if (!registry) {
      // eslint-disable-next-line no-console
      console.warn(`No registry found for category ${category}`);
      return NocoErrorViewFactory(category, name, false);
    }
    const componentPromise = registry.get(name)?.();
    if (!componentPromise) {
      // eslint-disable-next-line no-console
      console.warn(
        `No component found for category ${category} and name ${name}`
      );
      return NocoErrorViewFactory(category, name, true);
    }
    if (!this.loadingComponents.has(category)) {
      this.loadingComponents.set(category, new Map());
    }
    this.loadingComponents.get(category)!.set(name, componentPromise);
    const component = await componentPromise;
    this.loadingComponents.get(category)!.delete(name);
    if (!this.loadedComponents.has(category)) {
      this.loadedComponents.set(category, new Map());
    }
    this.loadedComponents.get(category)?.set(name, component);
    return component;
  }
}
