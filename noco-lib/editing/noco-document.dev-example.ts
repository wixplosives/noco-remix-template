import { NocoDoc } from "./noco-document";

if (typeof window !== "undefined") {
  const docX = NocoDoc.fromJSON({
    id: "UNIQUE_ID",
    __noco__type__: {
      id: "UNIQUE_ID",
      __noco__type__: "#component",
      value: "pageTemplates/defaultPageTemplate",
    },
    props: {
      title: {
        id: "UNIQUE_ID",
        __noco__type__: "#string",
        value: "Page Title",
      },
      children: {
        id: "UNIQUE_ID",
        __noco__type__: "#array",
        value: [
          {
            id: "UNIQUE_ID",
            __noco__type__: {
              id: "UNIQUE_ID",
              __noco__type__: "#component",
              value: "sections/hero",
            },
            props: {
              title: {
                id: "UNIQUE_ID",
                __noco__type__: "#string",
                value: "Hero Section Title",
              },
              subtitle: {
                id: "UNIQUE_ID",
                __noco__type__: "#string",
                value: "Hero Section Subtitle",
              },
              backgroundImage: {
                id: "UNIQUE_ID",
                __noco__type__: "#string",
                value: "https://via.placeholder.com/1920x1080",
              },
            },
          },
        ],
      },
    },
  });

  console.log("From Data");
  console.log(docX.root.toRenderable(getComponent));

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
    if (node.isComponent()) {
      console.log("Component", node.nodeID, node);
    }
  });

  console.log("Full format");
  console.log(el.toJSON());

  console.log("Renderable format");
  console.log(el.toRenderable(getComponent));
}
function getComponent(id: string) {
  return new Function(
    `return function ${id.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}() { return "Hello, world!"; }`
  )();
}
