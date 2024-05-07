import {
  AutoViewWrapperProps,
  ComponentWrapperRecord,
} from "../components-repo";

export const FieldWrapper = (props: AutoViewWrapperProps) => {
  return (
    <div className="field">
      {props.field} {props.required && "*"}:{props.children}
    </div>
  );
};

export const fieldWrapperRecord: ComponentWrapperRecord = {
  name: "field",
  component: FieldWrapper,
  predicate: (node) => node?.schema.type !== "object" && !!node?.field,
};
