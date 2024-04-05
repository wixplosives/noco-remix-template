import { idGen } from "./id-gen";

class NocoDoc {
  idGen = idGen("c");
  createNode<T extends string | NocoNode<string>>(
    tag: T,
    attributes: Array<NocoNode<"#attribute">>
  ) {
    return new NocoNode(this, tag, attributes);
  }
  createValueNode<const T extends string>(
    tag: T,
    value: NocoNodeValue
  ): NocoNode<T> {
    return new NocoNode(this, tag, [], value);
  }
  createAttribute(key: string, value: NocoNodeValue) {
    return this.createValueNode("#attribute", [key, value]);
  }
  createText(value: string | NocoNode) {
    return this.createValueNode("#text", value);
  }
  createElement(tagName: string, attrs?: Record<string, NocoNodeValue>) {
    const tag = this.createValueNode("#dom-element", tagName);
    return this.createNode(
      tag,
      attrs
        ? Object.entries(attrs).map(([key, value]) =>
            this.createAttribute(key, value)
          )
        : []
    );
  }
  createComponent(componentId: string) {
    const tag = this.createValueNode("#component", componentId);
    return this.createNode(tag, []);
  }
}

class Attrs {
  private byKey = new Map<string, NocoNode<"#attribute">>();
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
  private indexKeys(args: NocoNode<"#attribute">[]) {
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

type NocoNodeValue = string | NocoNode | NocoNodeValue[];

class NocoNode<
  Tag extends string | NocoNode<string> = string | NocoNode<string>
> {
  static isNocoNode(node: unknown): node is NocoNode {
    return node instanceof NocoNode;
  }
  #attrs: Attrs | undefined;
  constructor(
    public owner: NocoDoc,
    private tag: Tag,
    public attributes: NocoNode<"#attribute">[],
    public nodeValue?: NocoNodeValue,
    public nodeID: string = owner.idGen(),
    public parent: NocoNode | null = null
  ) {
    this.initParents(attributes, nodeValue);
  }
  private initParents(
    attributes: NocoNode<"#attribute">[],
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
  toJSON(options = { parentIds: true }): {
    tag: unknown;
    attributes: unknown[];
    nodeValue: unknown;
    nodeID: string;
  } {
    return {
      tag: typeof this.tag === "string" ? this.tag : this.tag.toJSON(options),
      attributes: this.attributes.map((attr) => attr.toJSON(options)),
      nodeValue: Array.isArray(this.nodeValue)
        ? this.nodeValue.map((child) =>
            NocoNode.isNocoNode(child) ? child.toJSON(options) : child
          )
        : NocoNode.isNocoNode(this.nodeValue)
        ? this.nodeValue.toJSON(options)
        : this.nodeValue,
      nodeID: this.nodeID,
      ...(options.parentIds && this.parent && { parentID: this.parent.nodeID }),
    };
  }
  toRenderable(getComponent: (id: string) => (...args: unknown[]) => unknown) {
    const tag = this.tag;
    let type: undefined | string | ((...args: unknown[]) => unknown);
    if (typeof tag === "string") {
      if (tag === "#text") {
        return this.nodeValue;
      } else {
        throw new Error("Invalid tag");
      }
    } else if (tag.tag === "#dom-element") {
      const val = tag.nodeValue;
      if (typeof val !== "string") {
        throw new Error("Invalid tag value");
      }
      type = val;
    } else if (tag.tag === "#component") {
      const val = tag.nodeValue;
      if (typeof val !== "string") {
        throw new Error("Invalid component ID");
      }
      type = getComponent(val);
    } else {
      throw new Error("Invalid tag");
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
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
if (typeof window !== "undefined") {
  const doc = new NocoDoc();

  const el = doc.createElement("div", {
    children: [
      doc.createText("Hello, world!"),
      doc.createElement("div", { children: [doc.createText("What's up?")] }),
      doc.createComponent("Button"),
    ],
    slot: doc.createComponent("Avatar"),
  });

  el.walkNoco((node) => {
    if (node.getTag() === "#component") {
      console.log("Component", node.nodeID, node);
    }
  });

  console.log("Full format");
  console.log(el.toJSON());

  console.log("Renderable format");

  console.log(
    el.toRenderable((id) => {
      return new Function(
        `return function ${id.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}() { return "Hello, world!"; }`
      )();
    })
  );
}
