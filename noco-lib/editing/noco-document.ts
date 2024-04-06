const TAGS = {
  // render components
  COMPONENT: "#component",
  ELEMENT: "#element",
  TEXT: "#text",
  // boxed value nodes
  ARRAY: "#array",
  STRING: "#string",
  BOOLEAN: "#boolean",
  NUMBER: "#number",
  OBJECT: "#object",
  NULL: "#null",
  UNDEFINED: "#undefined",
} as const;

type NocoRawValue = undefined | null | string | boolean | number | object;

type NocoStoredValue =
  | NocoRawValue
  | NocoStoredNode
  | {
      [key: string]: NocoStoredValue;
    }
  | readonly NocoStoredValue[];

type NocoStoredType =
  | string
  | { id: string; __noco__type__: string; value: NocoStoredValue };

type NocoStoredNode = {
  id: string;
  __noco__type__: NocoStoredType;
  value?: NocoStoredValue;
  props?: Record<string, NocoStoredNode>;
};

type NocoNodeValue =
  | NocoRawValue
  | NocoNode
  | {
      [key: string]: NocoNodeValue;
    }
  | readonly NocoNodeValue[];

type NocoComponentNode = NocoNode<
  NocoNode<typeof TAGS.COMPONENT, string>,
  never
>;

type NocoType = string | NocoNode<string>;
type NocoAttributes = Record<string, NocoNode> | undefined;

export class NocoDoc {
  static fromJSON(nocoData: NocoStoredNode) {
    if (typeof nocoData !== "object" || nocoData === null) {
      throw new Error("Invalid JSON");
    }
    const doc = new NocoDoc();
    const node = doc.toNocoNode(nocoData);
    if (node.isComponent()) {
      doc.setRoot(node);
    } else {
      throw new Error("Invalid root node is not a component");
    }
    return doc;
  }
  idGen = () => crypto.randomUUID();
  root = this.createComponent("noco/default-page");
  setRoot(node: NocoNode<NocoNode<typeof TAGS.COMPONENT, string>, never>) {
    this.root = node;
  }
  toNocoNode(nocoData: NocoStoredNode): NocoNode<NocoType, NocoNodeValue> {
    const nocoType =
      typeof nocoData.__noco__type__ === "string"
        ? nocoData.__noco__type__
        : this.createValueNode(
            nocoData.__noco__type__.__noco__type__,
            nocoData.__noco__type__.value,
            nocoData.__noco__type__.id
          );
    const attributes = nocoData.props
      ? Object.entries(nocoData.props).reduce((acc, [key, value]) => {
          acc[key] = this.toNocoNode(value);
          return acc;
        }, {} as NonNullable<NocoAttributes>)
      : undefined;
    return this.createNode(
      nocoType,
      attributes,
      this.toNocoValue(nocoData.value),
      nocoData.id
    );
  }
  toNocoValue(storedValue: NocoStoredValue): NocoNodeValue {
    let nodeValue;
    if (storedValue === undefined || storedValue === null) {
      nodeValue = storedValue;
    } else if (this.isNocoStoredArray(storedValue)) {
      nodeValue = storedValue.map((child) => this.toNocoValue(child));
    } else if (this.isNocoStoredNode(storedValue)) {
      nodeValue = this.toNocoNode(storedValue);
    } else if (typeof storedValue === "object") {
      nodeValue = Object.entries(storedValue).reduce((acc, [key, value]) => {
        acc[key] = this.toNocoValue(value);
        return acc;
      }, {} as Record<string, NocoNodeValue>);
    } else {
      nodeValue = storedValue;
    }
    return nodeValue;
  }
  isNocoStoredArray(value: NocoStoredValue): value is NocoStoredValue[] {
    return Array.isArray(value);
  }
  isNocoStoredNode(value: unknown): value is NocoStoredNode {
    return (
      value !== null && typeof value === "object" && "__noco__type__" in value
    );
  }
  private createNode<T extends string | NocoNode<string>>(
    nocoType: T,
    attributes: NocoAttributes,
    nodeValue?: NocoNodeValue,
    nodeId?: string
  ) {
    return new NocoNode(this, nocoType, attributes, nodeValue, nodeId);
  }
  private createValueNode<const T extends string, V extends NocoNodeValue>(
    nocoType: T,
    value: V,
    nodeId?: string
  ): NocoNode<T, V> {
    return new NocoNode(this, nocoType, undefined, value, nodeId);
  }
  createText(value: string | NocoNode) {
    const nocoType = this.createValueNode(TAGS.TEXT, value);
    return this.createNode(nocoType, {});
  }
  createElement(tagName: string) {
    const nocoType = this.createValueNode(TAGS.ELEMENT, tagName);
    return this.createNode(nocoType, {});
  }
  createComponent(componentId: string) {
    const nocoType = this.createValueNode(TAGS.COMPONENT, componentId);
    return this.createNode(nocoType, {});
  }
  createValue(value: NocoRawValue): NocoNode<string, NocoNodeValue> {
    if (Array.isArray(value)) {
      return this.createValueNode(
        TAGS.ARRAY,
        value.map((val) => this.createValue(val))
      );
    } else if (typeof value === "object" && value !== null) {
      return this.createValueNode(
        TAGS.OBJECT,
        Object.entries(value).reduce((acc, [key, value]) => {
          acc[key] = this.createValue(value);
          return acc;
        }, {} as Record<string, NocoNodeValue>)
      );
    } else if (typeof value === "string") {
      return this.createValueNode(TAGS.STRING, value);
    } else if (typeof value === "number") {
      return this.createValueNode(TAGS.NUMBER, value);
    } else if (typeof value === "boolean") {
      return this.createValueNode(TAGS.BOOLEAN, value);
    } else if (value === null) {
      return this.createValueNode(TAGS.NULL, null);
    } else if (value === undefined) {
      return this.createValueNode(TAGS.UNDEFINED, undefined);
    } else {
      throw new Error("Invalid value");
    }
  }
}

class NocoNode<
  T extends NocoType = NocoType,
  V extends NocoNodeValue = NocoNodeValue
> {
  static isNocoNode(node: unknown): node is NocoNode {
    return node instanceof NocoNode;
  }
  constructor(
    public doc: NocoDoc,
    private type: T,
    public attributes: NocoAttributes,
    public value: V,
    public id: string = doc.idGen(),
    public parent: NocoNode | null = null
  ) {
    this.initParents(attributes, value);
  }
  private initParents(attributes: NocoAttributes, nodeValue: NocoNodeValue) {
    if (attributes) {
      Object.values(attributes).forEach((attr) => attr.setParent(this));
    }
    if (Array.isArray(nodeValue)) {
      nodeValue.forEach(
        (child) => NocoNode.isNocoNode(child) && child.setParent(this)
      );
    } else if (NocoNode.isNocoNode(nodeValue)) {
      nodeValue.setParent(this);
    }
  }
  setValue(value: V) {
    this.value = value;
  }
  isComponent(): this is NocoComponentNode {
    return typeof this.type !== "string" && this.type.type === TAGS.COMPONENT;
  }
  getType(): string {
    if (typeof this.type === "string") {
      return this.type;
    } else {
      return this.type.type;
    }
  }
  getAttribute(name: string) {
    return this.attributes?.[name];
  }
  setParent(parent: NocoNode | null) {
    this.parent = parent;
  }
  walkNoco(
    callback: (node: NocoNode) => void,
    options = { attr: /./, value: true }
  ) {
    callback(this);
    if (options.attr && this.attributes) {
      for (const node of Object.values(this.attributes)) {
        node.walkNoco(callback, options);
      }
    }
    if (options.value) {
      const walkValue = (value: NocoNodeValue) => {
        if (Array.isArray(value)) {
          value.forEach((child) => walkValue(child));
        } else if (NocoNode.isNocoNode(value)) {
          value.walkNoco(callback, options);
        } else if (typeof value === "object" && value !== null) {
          Object.values(value).forEach((child) => walkValue(child));
        }
      };
      walkValue(this.value);
    }
  }
  toJSON(options = { parentIds: false }): NocoStoredNode {
    return {
      id: this.id,
      __noco__type__:
        typeof this.type === "string"
          ? this.type
          : {
              id: this.type.id,
              __noco__type__: this.type.type,
              value: this.type.value as string,
            },
      props: this.attributes
        ? Object.entries(this.attributes).reduce((acc, [key, node]) => {
            acc[key] = node.toJSON(options);
            return acc;
          }, {} as NonNullable<NocoStoredNode["props"]>)
        : undefined,
      value: this.valueToJSON(this.value),
      // Extra options
      ...(options.parentIds && this.parent && { parentID: this.parent.id }),
    };
  }
  typeToJSON(nocoType: NocoType): NocoStoredType {
    if (typeof nocoType === "string") {
      return nocoType;
    } else {
      return {
        id: nocoType.id,
        __noco__type__: nocoType.type,
        value: this.valueToJSON(nocoType.value),
      };
    }
  }
  valueToJSON(value: NocoNodeValue): NocoStoredValue {
    // TODO: create typed isNocoIsNocoValueArray to avoid the any that isArray is returning
    if (Array.isArray(value)) {
      return value.map((child) => this.valueToJSON(child));
    } else if (NocoNode.isNocoNode(value)) {
      return value.toJSON();
    } else if (typeof value === "object" && value !== null) {
      return Object.entries(value).reduce((acc, [key, value]) => {
        acc[key] = this.valueToJSON(value);
        return acc;
      }, {} as Record<string, unknown>);
    } else {
      return value;
    }
  }
  toRenderableValue(
    value: NocoNodeValue,
    getComponent: (id: string) => (...args: unknown[]) => unknown
  ): unknown {
    if (Array.isArray(value)) {
      return value.map((child) => this.toRenderableValue(child, getComponent));
    } else if (NocoNode.isNocoNode(value)) {
      return value.toRenderable(getComponent);
    } else if (typeof value === "object" && value !== null) {
      return Object.entries(value).reduce((acc, [key, value]) => {
        acc[key] = this.toRenderableValue(value, getComponent);
        return acc;
      }, {} as Record<string, unknown>);
    } else {
      return value;
    }
  }
  toRenderable(
    getComponent: (id: string) => (...args: unknown[]) => unknown
  ): unknown {
    const nocoType = this.type;
    let type: undefined | string | ((...args: unknown[]) => unknown);
    if (typeof nocoType === "string") {
      return this.toRenderableValue(this.value, getComponent);
    } else if (nocoType.type === TAGS.ELEMENT) {
      const val = nocoType.value;
      if (typeof val !== "string") {
        throw new Error(`Invalid element type ${val}`);
      }
      type = val;
    } else if (nocoType.type === TAGS.COMPONENT) {
      const val = nocoType.value;
      if (typeof val !== "string") {
        throw new Error(`Invalid component type ${val}`);
      }
      type = getComponent(val);
    } else if (nocoType.type === TAGS.TEXT) {
      const val = nocoType.value;
      if (typeof val !== "string") {
        throw new Error(`Invalid text type ${val}`);
      }
      return val;
    } else {
      throw new Error(`Invalid type ${nocoType}`);
    }
    const props: Record<string, unknown> = {};
    if (this.attributes) {
      for (const [key, node] of Object.entries(this.attributes)) {
        props[key] = node.toRenderable(getComponent);
      }
    }

    return {
      key: this.id,
      type: type,
      props,
    };
  }
}
