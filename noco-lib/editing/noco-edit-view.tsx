import React, { useMemo } from 'react';
import { pageTemplates } from '../page-templates';
import { sectionMap } from '../sections';
import { shrink } from '../universal/shrinker';
import type { BlockData, ExpandedDataWithBlock } from '../universal/types';
import { ComponentRegistry } from './component-registry';
import { componentRegistryContext, useComponent } from './use-component';

export interface NocoEditViewProps {
    data: ExpandedDataWithBlock;
}

const componentRegistry = new ComponentRegistry();
componentRegistry.addRegistry('pageTemplates', pageTemplates);
componentRegistry.addRegistry('sections', sectionMap);

export const NocoEditView = (props: NocoEditViewProps) => {
    const componentType = props.data.value.type.value;

    const pageData = useMemo(() => {
        return shrink(props.data);
    }, [props.data]) as BlockData;
    const Component = useComponent('pageTemplates', componentType);
    if (Component === null) {
        return <div>Loading...</div>;
    }
    return (
        <componentRegistryContext.Provider value={componentRegistry}>
            <Component {...pageData} />
        </componentRegistryContext.Provider>
    );
};
