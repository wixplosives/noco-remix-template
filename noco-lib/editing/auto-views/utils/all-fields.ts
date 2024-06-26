import { ExpandedData } from "noco-lib/universal/types";
import { CoreSchemaMetaSchema } from "../JSONSchema";

export const allFields = (
  { type, properties }: CoreSchemaMetaSchema,
  additional: Record<string, ExpandedData>
) => {
  if (type !== "object" || !properties) {
    throw Error("Object schema is required");
  }

  return Object.keys({
    ...properties,
    ...additional,
  });
};
