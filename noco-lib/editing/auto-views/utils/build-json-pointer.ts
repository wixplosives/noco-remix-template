import { JSONPointer } from "../components-repo";

export function buildJsonPointer(
  pointer: JSONPointer = "",
  ...keys: string[]
): string {
  if (pointer.includes("#")) {
    return pointer + "/" + keys.join("/");
  }
  return pointer + "#/" + keys.join("/");
}
