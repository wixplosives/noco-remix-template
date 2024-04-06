import { idGen } from "./id-gen";

const TAGS = {
  COMPONENT: "#component",
  ELEMENT: "#element",
  ATTR: "#attr",
  TEXT: "#text",
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

type NocoStoredNode = {
  id: string;
  __noco__type__:
    | string
    | { id: string; __noco__type__: string; value: string };
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
    if (Array.isArray(attr.nodeValue) && attr.nodeValue.length === 2) {
      return attr.nodeValue[1];
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
    args.forEach((attr) => {
      if (!Array.isArray(attr.nodeValue)) {
        throw new Error("Invalid attribute value");
      }
      const [key] = attr.nodeValue;
      if (typeof key !== "string") {
        throw new Error("Invalid attribute key");
      }
      this.byKey.set(key, attr);
    });
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
    public nodeValue: Value,
    public nodeID: string = owner.idGen(),
    public parent: NocoNode | null = null
  ) {
    this.initParents(attributes, nodeValue);
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
    options = { attr: /./, nodeValue: true }
  ) {
    callback(this);
    if (options.attr) {
      this.#attrs ??= new Attrs(this);
      for (const [, value] of this.#attrs.entries()) {
        if (Array.isArray(value)) {
          value.forEach(
            (child) =>
              NocoNode.isNocoNode(child) && child.walkNoco(callback, options)
          );
        } else if (NocoNode.isNocoNode(value)) {
          value.walkNoco(callback, options);
        }
      }
    }
    if (options.nodeValue) {
      if (Array.isArray(this.nodeValue)) {
        this.nodeValue.forEach(
          (child) =>
            NocoNode.isNocoNode(child) && child.walkNoco(callback, options)
        );
      } else if (NocoNode.isNocoNode(this.nodeValue)) {
        this.nodeValue.walkNoco(callback, options);
      }
    }
  }
  toJSON(options = { parentIds: false }): NocoStoredNode {
    return {
      id: this.nodeID,
      __noco__type__:
        typeof this.tag === "string"
          ? this.tag
          : {
              id: this.tag.nodeID,
              __noco__type__: this.tag.tag,
              value: this.tag.nodeValue as string,
            },

      props: this.attributes.length
        ? this.attributes.reduce((acc, attr) => {
            const [k, v] = attr.nodeValue;
            acc[k] = v.toJSON(options);
            return acc;
          }, {} as NonNullable<NocoStoredNode["props"]>)
        : undefined,
      value: Array.isArray(this.nodeValue)
        ? this.nodeValue.map((child) =>
            NocoNode.isNocoNode(child) ? child.toJSON(options) : child
          )
        : NocoNode.isNocoNode(this.nodeValue)
        ? this.nodeValue.toJSON(options)
        : this.nodeValue,

      ...(options.parentIds && this.parent && { parentID: this.parent.nodeID }),
    };
  }
  toRenderable(
    getComponent: (id: string) => (...args: unknown[]) => unknown
  ): unknown {
    const tag = this.tag;
    let type: undefined | string | ((...args: unknown[]) => unknown);
    if (typeof tag === "string") {
      if (tag === TAGS.TEXT) {
        return this.nodeValue;
      } else if (
        tag === TAGS.STRING ||
        tag === TAGS.NUMBER ||
        tag === TAGS.BOOLEAN ||
        tag === TAGS.NULL ||
        tag === TAGS.UNDEFINED
      ) {
        return this.nodeValue;
      } else if (tag === TAGS.ARRAY) {
        if (Array.isArray(this.nodeValue)) {
          return this.nodeValue.map((child) =>
            NocoNode.isNocoNode(child)
              ? child.toRenderable(getComponent)
              : child
          );
        } else {
          throw new Error(`Invalid array value ${this.nodeValue}`);
        }
      } else if (tag === TAGS.OBJECT) {
        if (typeof this.nodeValue === "object" && this.nodeValue !== null) {
          return Object.entries(this.nodeValue).reduce((acc, [key, value]) => {
            acc[key] = NocoNode.isNocoNode(value)
              ? value.toRenderable(getComponent)
              : value;
            return acc;
          }, {} as Record<string, unknown>);
        } else {
          throw new Error(`Invalid object value ${this.nodeValue}`);
        }
      } else {
        throw new Error(`Invalid tag ${tag}`);
      }
    } else if (tag.tag === TAGS.ELEMENT) {
      const val = tag.nodeValue;
      if (typeof val !== "string") {
        throw new Error(`Invalid element tag ${val}`);
      }
      type = val;
    } else if (tag.tag === TAGS.COMPONENT) {
      const val = tag.nodeValue;
      if (typeof val !== "string") {
        throw new Error(`Invalid component tag ${val}`);
      }
      type = getComponent(val);
    } else {
      throw new Error(`Invalid tag ${tag}`);
    }
    const props: Record<string, unknown> = {};
    this.#attrs ??= new Attrs(this);

    for (const [key, value] of this.#attrs.entries()) {
      if (Array.isArray(value)) {
        props[key] = value.map((child) =>
          NocoNode.isNocoNode(child) ? child.toRenderable(getComponent) : child
        );
      } else if (NocoNode.isNocoNode(value)) {
        props[key] = value.toRenderable(getComponent);
      } else {
        props[key] = value;
      }
    }

    return {
      key: this.nodeID,
      type: type,
      props,
    };
  }
}
