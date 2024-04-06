import { idGen } from "./id-gen";

const TAGS = {
  COMPONENT: "#component",
  ELEMENT: "#element",
  // value nodes
  ATTR: "#attr",
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

type NocoStoredValue =
  | undefined
  | null
  | string
  | boolean
  | number
  | object
  | NocoStoredNode
  | {
      [key: string]: NocoStoredValue;
    }
  | readonly NocoStoredValue[];

type NocoStoredTag =
  | string
  | { id: string; __noco__type__: string; value: NocoStoredValue };

type NocoStoredNode = {
  id: string;
  __noco__type__: NocoStoredTag;
  value?: NocoStoredValue;
  props?: Record<string, NocoStoredNode>;
  parentID?: string;
};

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
  idGen = idGen("c");
  root = this.createComponent("noco/default-page");
  setRoot(node: NocoNode<NocoNode<typeof TAGS.COMPONENT, string>, never>) {
    this.root = node;
  }
  toNocoNode(nocoData: NocoStoredNode): NocoNode<NocoTag, NocoNodeValue> {
    const tag =
      typeof nocoData.__noco__type__ === "string"
        ? nocoData.__noco__type__
        : this.createValueNode(
            nocoData.__noco__type__.__noco__type__,
            nocoData.__noco__type__.value,
            nocoData.__noco__type__.id
          );
    const attrs = Object.entries(nocoData.props ?? {}).map(([key, value]) => {
      return this.createAttribute(key, this.toNocoNode(value));
    });
    return this.createNode(
      tag,
      attrs,
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
  createNode<T extends string | NocoNode<string>>(
    tag: T,
    attributes: NocoAttributeNode[],
    nodeValue?: NocoNodeValue,
    nodeId?: string
  ) {
    return new NocoNode(this, tag, attributes, nodeValue, nodeId);
  }
  createValueNode<const T extends string, V extends NocoNodeValue>(
    tag: T,
    value: V,
    nodeId?: string
  ): NocoNode<T, V> {
    return new NocoNode(this, tag, [], value, nodeId);
  }
  createAttribute(key: string, value: NocoNode) {
    return this.createValueNode(TAGS.ATTR, [key, value] as const);
  }
  createText(value: string | NocoNode) {
    return this.createValueNode(TAGS.TEXT, value);
  }
  createElement(tagName: string) {
    const tag = this.createValueNode(TAGS.ELEMENT, tagName);
    return this.createNode(tag, []);
  }
  createComponent(componentId: string) {
    const tag = this.createValueNode(TAGS.COMPONENT, componentId);
    return this.createNode(tag, []);
  }
}

class Attrs {
  private byKey = new Map<string, NocoAttributeNode>();
  constructor(public owner: NocoNode) {
    this.indexKeys(owner.attributes);
  }
  getAttribute(key: string) {
    const attr = this.byKey.get(key);
    if (!attr) {
      return undefined;
    }
    if (Array.isArray(attr.value) && attr.value.length === 2) {
      return attr.value[1];
    } else {
      throw new Error("Invalid attribute value");
    }
  }
  *entries() {
    for (const key of this.byKey.keys()) {
      yield [key, this.getAttribute(key)] as const;
    }
  }
  private indexKeys(args: NocoAttributeNode[]) {
    for (const attr of args) {
      if (!Array.isArray(attr.value)) {
        throw new Error("Invalid attribute value");
      }
      const [key] = attr.value;
      if (typeof key !== "string") {
        throw new Error("Invalid attribute key");
      }
      this.byKey.set(key, attr);
    }
  }
}

type NocoTag = string | NocoNode<string>;

type NocoNodeValue =
  | undefined
  | null
  | string
  | boolean
  | number
  | object
  | NocoNode
  | {
      [key: string]: NocoNodeValue;
    }
  | readonly NocoNodeValue[];

type NocoAttributeNode = NocoNode<
  typeof TAGS.ATTR,
  readonly [string, NocoNode]
>;

type NocoComponentNode = NocoNode<
  NocoNode<typeof TAGS.COMPONENT, string>,
  never
>;

class NocoNode<
  Tag extends NocoTag = NocoTag,
  Value extends NocoNodeValue = NocoNodeValue
> {
  static isNocoNode(node: unknown): node is NocoNode {
    return node instanceof NocoNode;
  }
  #attrs: Attrs | undefined;
  constructor(
    public owner: NocoDoc,
    private tag: Tag,
    public attributes: NocoAttributeNode[],
    public value: Value,
    public id: string = owner.idGen(),
    public parent: NocoNode | null = null
  ) {
    this.initParents(attributes, value);
  }
  private initParents(
    attributes: NocoAttributeNode[],
    nodeValue?: NocoNodeValue
  ) {
    attributes.forEach((attr) => attr.setParent(this));
    if (Array.isArray(nodeValue)) {
      nodeValue.forEach(
        (child) => NocoNode.isNocoNode(child) && child.setParent(this)
      );
    } else if (NocoNode.isNocoNode(nodeValue)) {
      nodeValue.setParent(this);
    }
  }
  isComponent(): this is NocoComponentNode {
    return typeof this.tag !== "string" && this.tag.tag === TAGS.COMPONENT;
  }
  isAttribute(): this is NocoAttributeNode {
    return typeof this.tag === "string" && this.tag === TAGS.ATTR;
  }
  getTag() {
    if (typeof this.tag === "string") {
      return this.tag;
    } else {
      return this.tag.tag;
    }
  }
  getAttribute(name: string) {
    this.#attrs ??= new Attrs(this);
    return this.#attrs.getAttribute(name);
  }
  setParent(parent: NocoNode | null) {
    this.parent = parent;
  }
  walkNoco(
    callback: (node: NocoNode) => void,
    options = { attr: /./, value: true }
  ) {
    callback(this);
    if (options.attr) {
      for (const attr of this.attributes) {
        attr.value[1].walkNoco(callback, options);
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
        typeof this.tag === "string"
          ? this.tag
          : {
              id: this.tag.id,
              __noco__type__: this.tag.tag,
              value: this.tag.value as string,
            },

      props: this.attributes.length
        ? this.attributes.reduce((acc, attr) => {
            const [key, node] = attr.value;
            acc[key] = node.toJSON(options);
            return acc;
          }, {} as NonNullable<NocoStoredNode["props"]>)
        : undefined,
      value: this.valueToJSON(this.value),
      ...(options.parentIds && this.parent && { parentID: this.parent.id }),
    };
  }
  tagToJSON(tag: NocoTag): NocoStoredTag {
    if (typeof tag === "string") {
      return tag;
    } else {
      return {
        id: tag.id,
        __noco__type__: tag.tag,
        value: this.valueToJSON(tag.value),
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
  private toRenderableValue(
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
    const tag = this.tag;
    let type: undefined | string | ((...args: unknown[]) => unknown);
    if (typeof tag === "string") {
      return this.toRenderableValue(this.value, getComponent);
    } else if (tag.tag === TAGS.ELEMENT) {
      const val = tag.value;
      if (typeof val !== "string") {
        throw new Error(`Invalid element tag ${val}`);
      }
      type = val;
    } else if (tag.tag === TAGS.COMPONENT) {
      const val = tag.value;
      if (typeof val !== "string") {
        throw new Error(`Invalid component tag ${val}`);
      }
      type = getComponent(val);
    } else {
      throw new Error(`Invalid tag ${tag}`);
    }
    const props: Record<string, unknown> = {};
    for (const attr of this.attributes) {
      const [key, node] = attr.value;
      props[key] = node.toRenderable(getComponent);
    }

    return {
      key: this.id,
      type: type,
      props,
    };
  }
}
