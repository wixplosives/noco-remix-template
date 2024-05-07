import React from "react";

import { AutoViewProps } from "./types";
import { CoreSchemaMetaSchema } from "./JSONSchema";

export type JSONPointer = string;
export type RepoName = string;

export interface ComponentsRepoCollection {
  [repoName: string]: ComponentsRepo;
}

export interface ComponentsRepoStorage<P> {
  [type: string | symbol]: Array<ComponentRepoRecord<P>>;
}

export type Predicate = (props: AutoViewProps) => boolean;

export interface AutoViewWrapperProps extends AutoViewProps {
  children: React.ReactNode;
}

export type AutoViewWrapper = React.ComponentType<AutoViewWrapperProps>;

export type AutoViewUnionSelector = React.ComponentType<
  AutoViewProps & {
    children: React.ReactNode;
    select: (pointer: string) => void;
    schemas: Array<{
      schema: CoreSchemaMetaSchema;
      pointer: string;
    }>;
    selected: string;
  }
>;

export type UnionSelectorPredicate = (
  props: AutoViewProps,
  schemas: Array<{
    schema: CoreSchemaMetaSchema;
    pointer: string;
  }>
) => boolean;

export type GetNode = (node: CoreSchemaMetaSchema) => string;

export interface ComponentRepoRecord<P> {
  name: string;
  component: React.ComponentType<P>;
  predicate: Predicate;
}
export interface ComponentWrapperRecord {
  name: string;
  component: AutoViewWrapper;
  predicate?: Predicate;
}
export interface UnionSelectorRecord {
  name: string;
  component: AutoViewUnionSelector;
  predicate: UnionSelectorPredicate;
}
export type ComponentRepoRecordFactory<P, U> = (
  innerComponent: React.ComponentType<P>
) => ComponentRepoRecord<U>;

export type ReplaceComponentRepoRecordFn = (
  record: ComponentRepoRecord<AutoViewProps>
) => ComponentRepoRecord<AutoViewProps>;

const filterByPredicate = (props: AutoViewProps, predicate?: Predicate) =>
  !predicate || predicate(props);

export class ComponentsRepo {
  private byPredicate: Array<ComponentRepoRecord<AutoViewProps>> = [];

  private byName = new Map<string, ComponentRepoRecord<AutoViewProps>>();

  private wrappers: Array<ComponentWrapperRecord> = [];
  private unionSelectors: UnionSelectorRecord[] = [];
  constructor(
    public name: string,
    public getNodeType: GetNode = (node) => node.type as string
  ) {}

  public register(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record: ComponentRepoRecord<AutoViewProps<any>>
  ) {
    if (this.byName.has(record.name)) {
      throw new Error(
        `Component record with name '${record.name}' is already registered in ComponentRepo '${this.name}'. You can't register multiple records with same name.`
      );
    }

    this.byPredicate.push(record);
    this.byName.set(record.name, record);
    return this;
  }

  public remove(name: string) {
    this.byName.delete(name);
    this.byPredicate = this.byPredicate.filter(
      (record) => record.name !== name
    );
    return this;
  }

  public replace(name: string, fn: ReplaceComponentRepoRecordFn) {
    const originalRecord = this.get(name);

    if (!originalRecord) {
      return this;
    }

    const record = fn(originalRecord);
    this.byName.delete(name);

    this.byName.set(name, record);
    this.byPredicate = this.byPredicate.map((r) =>
      r.name === name ? record : r
    );
    return this;
  }

  public get(name: string) {
    return this.byName.get(name);
  }

  public getNames() {
    return Array.from(this.byName.keys());
  }

  public getMatched(props: AutoViewProps) {
    return this.byPredicate.filter(({ predicate }) => predicate(props));
  }

  public addWrapper(record: ComponentWrapperRecord) {
    this.wrappers.push(record);

    return this;
  }

  public getWrappers(props: AutoViewProps) {
    return this.wrappers
      .filter(({ predicate }) => filterByPredicate(props, predicate))
      .map(({ component }) => component);
  }

  public addUnionSelector(record: UnionSelectorRecord) {
    this.unionSelectors.push(record);

    return this;
  }
  public getUnionSelectors(
    props: AutoViewProps,
    schemas: Array<{
      schema: CoreSchemaMetaSchema;
      pointer: string;
    }>
  ) {
    return this.unionSelectors
      .filter(({ predicate }) => !predicate || predicate(props, schemas))
      .map(({ component }) => component);
  }

  public getRawWrappers() {
    return this.wrappers;
  }

  public clone(name: string, getNodeType?: GetNode) {
    const copy = new ComponentsRepo(name, getNodeType || this.getNodeType);
    this.byPredicate.forEach((record) => copy.register(record));

    this.wrappers.forEach((record) => {
      copy.addWrapper(record);
    });
    return copy;
  }
}
