import {
  AutoViewWrapperProps,
  ComponentWrapperRecord,
} from "../components-repo";

export const ObjectWrapper = (props: AutoViewWrapperProps) => {
  const item = props.children;
  if (props.schema.title || props.field) {
    return (
      <div className="object">
        <h2>
          {props.field && <span>{props.field}</span>}
          {props.schema.title && props.field && <span>: </span>}
          {props.schema.title && <span>{props.schema.title}</span>}
        </h2>
        {item}
      </div>
    );
  }
  return item;
};

export const objectWrapperRecord: ComponentWrapperRecord = {
  name: "object",
  component: ObjectWrapper,
  predicate: (node) => node?.schema.type === "object",
};
