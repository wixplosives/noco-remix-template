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
    value: NocoNodeValue,
    tag: T
  ): NocoNode<T> {
    return new NocoNode(this, tag, [], value);
  }
  createAttribute(key: string, value: NocoNodeValue) {
    return this.createValueNode([key, value], "#attribute");
  }
  createText(value: string | NocoNode) {
    return this.createValueNode(value, "#text");
  }
  createElement(tagName: string, children: Array<NocoNode>) {
    const tag = this.createValueNode(tagName, "#dom-element");
    return this.createNode(tag, [this.createAttribute("children", children)]);
  }
  createComponent(componentId: string) {
    const tag = this.createValueNode(componentId, "#component");
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
    if (Array.isArray(attr.nodeValue)) {
      const valueNode = attr.nodeValue[1];
      if (NocoNode.isNocoNode(valueNode)) {
        return valueNode.nodeValue;
      }
      return valueNode;
    } else if (NocoNode.isNocoNode(attr.nodeValue)) {
      return attr.nodeValue.nodeValue;
    } else {
      return attr.nodeValue;
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
  constructor(
    public owner: NocoDoc,
    public tag: Tag,
    public attributes: NocoNode<"#attribute">[],
    public nodeValue?: NocoNodeValue,
    public nodeID: string = owner.idGen(),
    public parent: NocoNode | null = null
  ) {
    this.initParents(attributes, nodeValue);
  }
  #attrs: Attrs | undefined;
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
  getAttribute(name: string) {
    if (!this.#attrs) {
      this.#attrs = new Attrs(this);
    }
    return this.#attrs.getAttribute(name);
  }
  setParent(parent: NocoNode | null) {
    this.parent = parent;
  }
  toJSON(): {
    tag: unknown;
    attributes: unknown[];
    nodeValue: unknown;
    nodeID: string;
  } {
    return {
      tag: typeof this.tag === "string" ? this.tag : this.tag.toJSON(),
      attributes: this.attributes.map((attr) => attr.toJSON()),
      nodeValue: Array.isArray(this.nodeValue)
        ? this.nodeValue.map((child) =>
            NocoNode.isNocoNode(child) ? child.toJSON() : child
          )
        : NocoNode.isNocoNode(this.nodeValue)
        ? this.nodeValue.toJSON()
        : this.nodeValue,
      nodeID: this.nodeID,
    };
  }
  toRenderable(getComponent: (id: string) => (...args: unknown[]) => unknown) {
    const tag = this.tag;
    let renderTagId: undefined | string | ((...args: unknown[]) => unknown);
    let renderChildren: unknown[] = [];
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
      renderTagId = val;
    } else if (tag.tag === "#component") {
      const val = tag.nodeValue;
      if (typeof val !== "string") {
        throw new Error("Invalid component ID");
      }
      renderTagId = getComponent(val);
    } else {
      throw new Error("Invalid tag");
    }
    const children = this.getAttribute("children");
    if (children) {
      if (!Array.isArray(children)) {
        throw new Error("Invalid children attribute");
      }
      renderChildren = children.map((child) =>
        NocoNode.isNocoNode(child) ? child.toRenderable(getComponent) : child
      );
    }
    return {
      type: renderTagId,
      props: {
        children: renderChildren,
      },
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

  const el = doc.createElement("div", [
    doc.createText("Hello, world!"),
    doc.createElement("div", [doc.createText("What's up?")]),
    doc.createComponent("my-component"),
  ]);
  console.log("Full format");
  console.log(el.toJSON());

  console.log("Renderable format");
  console.log(
    el.toRenderable(() => {
      return () => null;
    })
  );
}
