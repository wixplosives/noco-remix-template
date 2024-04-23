import { ComponentRegistry } from "noco-lib/editing/component-registry";
import { Await } from "@remix-run/react";
import { Suspense } from "react";

function renderNocoDocument(
  doc: unknown,
  registry: ComponentRegistry
): React.ReactNode {
  if (
    doc === null ||
    doc === undefined ||
    typeof doc === "number" ||
    typeof doc === "boolean" ||
    typeof doc === "string"
  ) {
    return doc;
  }
  if (Array.isArray(doc)) {
    return doc.map((child) => renderNocoDocument(child, registry));
  }
  if (typeof doc === "object") {
    if ("children" in doc && "type" in doc && "props" in doc && "id" in doc) {
      if (typeof doc.type !== "string") {
        throw new Error(`Invalid document type: ${JSON.stringify(doc)}`);
      }
      if (typeof doc.id !== "string") {
        throw new Error(`Invalid document id: ${JSON.stringify(doc)}`);
      }
      if (typeof doc.props !== "object") {
        throw new Error(`Invalid document props: ${JSON.stringify(doc)}`);
      }
      const { id, type, props, children } = doc;

      const renderedChildren = renderNocoDocument(children, registry);

      if (registry.hasDriver(type)) {
        return (
          <Await key={id} resolve={registry.loadComponentById(type)}>
            {(Comp) => <Comp {...props}>{renderedChildren}</Comp>}
          </Await>
        );
      } else {
        const Comp = type as "div";
        return (
          <Comp key={id} {...props}>
            {renderedChildren}
          </Comp>
        );
      }
    }
  }
  throw new Error(`Unknown document type: ${JSON.stringify(doc)}`);
}

export function NocoPage({
  doc,
  registry,
  fallback,
}: {
  doc: unknown;
  registry: ComponentRegistry;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>{renderNocoDocument(doc, registry)}</Suspense>
  );
}
