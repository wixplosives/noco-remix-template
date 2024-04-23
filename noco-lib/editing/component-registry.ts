/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ErrorView } from "./noco-error-view";
export type ComponentDriver = {
  id: string;
  type: string;
  loadComponent: () => Promise<React.ComponentType<any>>;
  LoadSchema?: () => Promise<unknown>;
  component?: React.ComponentType<any>;
  schema?: unknown;
  componentPromise?: Promise<React.ComponentType<any>>;
  schemaPromise?: Promise<unknown>;
  componentLoadError?: unknown;
};

export class ComponentRegistry {
  byId = new Map<string, ComponentDriver>();
  byType = new Map<string, Map<string, ComponentDriver>>();
  register(componentDriver: ComponentDriver) {
    this.validateRegistration(componentDriver);
    this.byId.set(componentDriver.id, componentDriver);
    this.indexByType(componentDriver);
  }
  registerAll(componentDrivers: ComponentDriver[]) {
    componentDrivers.forEach((componentDriver) =>
      this.register(componentDriver)
    );
  }
  hasDriver(id: string) {
    return this.byId.has(id);
  }
  getDriverById(id: string) {
    const componentDriver = this.byId.get(id);
    if (!componentDriver) {
      throw new Error(`Component with id ${id} not found`);
    }
    return componentDriver;
  }
  getComponentById(id: string) {
    return this.byId.get(id)?.component;
  }
  // this function should always returns the same promise
  loadComponentById(id: string) {
    const componentDriver = this.getDriverById(id);
    if (componentDriver.component) {
      return componentDriver.component;
    }
    if (!componentDriver.componentPromise) {
      componentDriver.componentPromise = componentDriver.loadComponent();
    }
    componentDriver.componentPromise
      .then((Comp) => {
        componentDriver.component = Comp;
      })
      .catch((e) => {
        componentDriver.componentLoadError = e;
      });
    return componentDriver.componentPromise;
  }
  getErrorView() {
    const comp = this.getDriverById("NocoErrorView")?.component;
    if (!comp) {
      throw new Error("NocoErrorView is not found");
    }
    return comp as typeof ErrorView;
  }
  private indexByType(componentDriver: ComponentDriver) {
    if (!this.byType.has(componentDriver.type)) {
      this.byType.set(componentDriver.type, new Map());
    }
    this.byType
      .get(componentDriver.type)!
      .set(componentDriver.id, componentDriver);
  }

  private validateRegistration(componentDriver: ComponentDriver) {
    if (this.byId.has(componentDriver.id)) {
      throw new Error(
        `Component with id ${componentDriver.id} already registered`
      );
    }
  }
}
