import {
  AutoViewUnionSelectorProps,
  UnionSelectorRecord,
} from "../components-repo";

export const FieldUnionSelector = (props: AutoViewUnionSelectorProps) => {
  return (
    <>
      <select
        value={props.selected}
        onChange={(e) => props.select(e.target.value)}
      >
        {props.schemas.map(({ schema, schemaPointer }) => (
          <option key={schemaPointer} value={schemaPointer}>
            {schema.title || schema.type || schemaPointer}
          </option>
        ))}
      </select>
      {props.children}
    </>
  );
};

export const fieldUnionSelectorRecord: UnionSelectorRecord = {
  component: FieldUnionSelector,
  name: "field-selector",
  predicate: (props) => {
    return true;
  },
};
