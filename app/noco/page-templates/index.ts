import type { ComponentRegistryMap } from '../noco-edit-view/component-registry';

export const pageTemplates: ComponentRegistryMap = new Map([
    ['defaultPageTemplate', async () => (await import('./default-page-template')).DefaultPageTemplate],
]);
