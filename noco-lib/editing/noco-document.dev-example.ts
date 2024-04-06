import { NocoDoc } from "./noco-document";

if (typeof window !== "undefined") {
  const data = {
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
  };

  const docX = NocoDoc.fromJSON(data);

  console.log("ROOT", docX.root);

  docX.root.walkNoco((node) => {
    if (node.isComponent()) {
      console.log("Component", node.id, node);
    }
  });

  console.log("Stored Format");
  console.log(docX.root.toJSON(), deepEqual(docX.root.toJSON(), data));

  console.log("Renderable format");
  console.log(docX.root.toRenderable(getComponent));

  const valueNode = docX.createValue({
    name: "John Doe",
    age: 30,
    friends: ["Jane", "Jack", "Jill"],
    address: {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
    },
  });

  console.log("Value Node", valueNode);
}

function getComponent(id: string) {
  return new Function(
    `return function ${id.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}() { return "Hello, world!"; }`
  )();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepEqual(obj1: any, obj2: any) {
  let keys1 = Object.keys(obj1);
  let keys2 = Object.keys(obj2);
  //filter undefined keys
  keys1 = keys1.filter((key) => obj1[key] !== undefined);
  keys2 = keys2.filter((key) => obj2[key] !== undefined);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
      return false;
    }
    if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
      if (!deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    } else {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
  }
  return true;
}
