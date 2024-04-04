import React from "react";

export interface DefaultPageTemplateProps {
  title: string;
  /** @from sections */
  children: React.ReactNode;
}

export const DefaultPageTemplate = (props: DefaultPageTemplateProps) => {
  return (
    <div>
      <h1>{props.title}!!!</h1>
      {props.children}
    </div>
  );
};
