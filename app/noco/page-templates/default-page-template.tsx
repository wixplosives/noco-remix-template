import React from "react";
import "./default-page-template.css";

export interface DefaultPageTemplateProps {
  title: string;
  /** @from sections */
  children: React.ReactNode;
}

export const DefaultPageTemplate = (props: DefaultPageTemplateProps) => {
  return (
    <div>
      <div className="DefaultPageTemplate_grid">
        <menu>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </menu>
      </div>
      <h1>{props.title}!!!</h1>
      {props.children}
    </div>
  );
};
