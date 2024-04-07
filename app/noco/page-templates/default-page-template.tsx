import React from "react";

export interface DefaultPageTemplateProps {
  title: string;
  /** @from sections */
  children: React.ReactNode;
}

export const DefaultPageTemplate = (props: DefaultPageTemplateProps) => {
  return (
    <div>
      <menu>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </menu>
      <h1>{props.title}!!!</h1>
      {props.children}
    </div>
  );
};
