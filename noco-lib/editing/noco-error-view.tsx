import React from 'react';

export const cachedComponentMap = new Map<string, Map<string, React.ComponentType<any>>>();
export const NocoErrorViewFactory = (categoryName: string, componentName: string, categoryFound: boolean) => {
    if (cachedComponentMap.has(categoryName)) {
        const categoryMap = cachedComponentMap.get(categoryName)!;
        if (categoryMap.has(componentName)) {
            return categoryMap.get(componentName)!;
        }
    }
    const errorView = () => {
        return (
            <div>
                <h1>
                    {categoryFound
                        ? `Component ${componentName} not found in category ${categoryName}`
                        : `Category ${categoryName} not found`}
                </h1>
            </div>
        );
    };
    if (!cachedComponentMap.has(categoryName)) {
        cachedComponentMap.set(categoryName, new Map());
    }
    cachedComponentMap.get(categoryName)!.set(componentName, errorView);
    return errorView;
};
