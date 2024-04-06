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

type NocoType = string;
type NocoStoredType = string;

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

type NocoComponentNode = NocoNode<typeof TAGS.COMPONENT, string>;

type NocoAttributes = Record<string, NocoNode> | undefined;

type TODO_MUTATION_EVENTS =
  | { node: NocoNode; change: string; value: unknown }
  | string;

class Signal<T> extends Set<(value: T) => void> {
  emit(value: T) {
    for (const listener of this) {
      listener(value);
    }
  }
}

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
  onChange = new Signal<TODO_MUTATION_EVENTS>();
  idGen = () => crypto.randomUUID();
  root = this.createComponent("noco/default-page");
  mutations = {
    set: (node: NocoNode, value: NocoNodeValue) => {
      node.value = value;
      this.onChange.emit({ node, change: "set", value });
    },
    setAttribute: (node: NocoNode, key: string, value: NocoNode) => {
      if (!node.attributes) {
        throw new Error("Value node has no attributes to set");
      }
      node.attributes[key] = value;
      this.onChange.emit({ node, change: "setAttribute", value });
    },
    removeAttribute: (node: NocoNode, key: string) => {
      if (!node.attributes) {
        throw new Error("Value node has no attributes to remove");
      }
      delete node.attributes[key];
      this.onChange.emit({ node, change: "removeAttribute", value: key });
    },
  };
  setRoot(node: NocoComponentNode) {
    this.root = node;
  }
  toNocoNode(nocoData: NocoStoredNode): NocoNode<NocoType, NocoNodeValue> {
    return this.createNode(
      nocoData.__noco__type__,
      this.toNocoAttributes(nocoData),
      this.toNocoValue(nocoData.value),
      nocoData.id
    );
  }
  toNocoAttributes(nocoData: NocoStoredNode) {
    return nocoData.props
      ? Object.entries(nocoData.props).reduce((acc, [key, value]) => {
          acc[key] = this.toNocoNode(value);
          return acc;
        }, {} as NonNullable<NocoAttributes>)
      : undefined;
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
  private createNode<T extends NocoType>(
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
    return this.createNode(TAGS.TEXT, {}, value);
  }
  createElement(tagName: string) {
    return this.createNode(TAGS.ELEMENT, {}, tagName);
  }
  createComponent(componentId: string) {
    return this.createNode(TAGS.COMPONENT, {}, componentId);
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
  isComponent(): this is NocoComponentNode {
    return this.type === TAGS.COMPONENT;
  }
  getAttribute(name: string) {
    return this.attributes?.[name];
  }
  //// Mutations
  setValue(value: V) {
    this.doc.mutations.set(this, value);
  }
  setAttribute(name: string, value: NocoNode) {
    this.doc.mutations.setAttribute(this, name, value);
  }
  removeAttribute(name: string) {
    this.doc.mutations.removeAttribute(this, name);
  }
  ////////////////////////////////////////////////////////
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
      __noco__type__: this.type,
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
      if (nocoType === TAGS.TEXT) {
        const val = this.value;
        if (typeof val !== "string") {
          throw new Error(`Invalid text type ${val}`);
        }
        return val;
      } else if (nocoType === TAGS.ELEMENT) {
        const val = this.value;
        if (typeof val !== "string") {
          throw new Error(`Invalid element type ${val}`);
        }
        type = val;
      } else if (nocoType === TAGS.COMPONENT) {
        const val = this.value;
        if (typeof val !== "string") {
          throw new Error(`Invalid component type ${val}`);
        }
        type = getComponent(val);
      } else {
        return this.toRenderableValue(this.value, getComponent);
      }
    } else {
      throw new Error(`Invalid render type ${nocoType}`);
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
