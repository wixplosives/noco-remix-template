import type ajv from "ajv";
import { CoreSchemaMetaSchema } from "../JSONSchema";
import { ValidationError } from "../types";

export function formatValidationError(error: ajv.ErrorObject): ValidationError {
  return {
    data: error.data,
    schema: error.parentSchema as CoreSchemaMetaSchema,
    keyword: error.keyword,
    message: error.message || "Validation failed",
    schemaPointer: error.schemaPath.replace(/^#/, ""),
    dataPointer: error.dataPath,
  };
}
