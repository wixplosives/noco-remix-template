export const sectionMap = new Map<string, () => Promise<React.ComponentType<any>>>();
sectionMap.set('hero', async () => (await import('./hero')).Hero);
sectionMap.set('gallery', async () => (await import('./gallery')).Gallery);
