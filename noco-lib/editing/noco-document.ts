import { idGen } from "./id-gen";

const TAGS = {
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

type NocoValueConstraints =
  | undefined
  | null
  | string
  | boolean
  | number
  | object;

type NocoStoredValue =
  | NocoValueConstraints
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
    const attrs = nocoData.props
      ? Object.entries(nocoData.props).reduce((acc, [key, value]) => {
          acc[key] = this.toNocoNode(value);
          return acc;
        }, {} as NonNullable<NocoAttributes>)
      : undefined;
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
  private createNode<T extends string | NocoNode<string>>(
    tag: T,
    attributes: NocoAttributes,
    nodeValue?: NocoNodeValue,
    nodeId?: string
  ) {
    return new NocoNode(this, tag, attributes, nodeValue, nodeId);
  }
  private createValueNode<const T extends string, V extends NocoNodeValue>(
    tag: T,
    value: V,
    nodeId?: string
  ): NocoNode<T, V> {
    return new NocoNode(this, tag, undefined, value, nodeId);
  }
  createText(value: string | NocoNode) {
    const tag = this.createValueNode(TAGS.TEXT, value);
    return this.createNode(tag, {});
  }
  createElement(tagName: string) {
    const tag = this.createValueNode(TAGS.ELEMENT, tagName);
    return this.createNode(tag, {});
  }
  createComponent(componentId: string) {
    const tag = this.createValueNode(TAGS.COMPONENT, componentId);
    return this.createNode(tag, {});
  }
  createValue(value: NocoValueConstraints): NocoNode<string, NocoNodeValue> {
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

type NocoNodeValue =
  | NocoValueConstraints
  | NocoNode
  | {
      [key: string]: NocoNodeValue;
    }
  | readonly NocoNodeValue[];

type NocoComponentNode = NocoNode<
  NocoNode<typeof TAGS.COMPONENT, string>,
  never
>;

type NocoTag = string | NocoNode<string>;
type NocoAttributes = Record<string, NocoNode> | undefined;

class NocoNode<
  Tag extends NocoTag = NocoTag,
  Value extends NocoNodeValue = NocoNodeValue
> {
  static isNocoNode(node: unknown): node is NocoNode {
    return node instanceof NocoNode;
  }
  constructor(
    public doc: NocoDoc,
    private tag: Tag,
    public attributes: NocoAttributes,
    public value: Value,
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
    return typeof this.tag !== "string" && this.tag.tag === TAGS.COMPONENT;
  }
  getTag() {
    if (typeof this.tag === "string") {
      return this.tag;
    } else {
      return this.tag.tag;
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
        typeof this.tag === "string"
          ? this.tag
          : {
              id: this.tag.id,
              __noco__type__: this.tag.tag,
              value: this.tag.value as string,
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
    } else if (tag.tag === TAGS.TEXT) {
      const val = tag.value;
      if (typeof val !== "string") {
        throw new Error(`Invalid text tag ${val}`);
      }
      return val;
    } else {
      throw new Error(`Invalid tag ${tag}`);
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
