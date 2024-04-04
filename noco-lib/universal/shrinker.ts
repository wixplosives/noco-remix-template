import type { ExpandedData } from './types';

export function shrink(content: ExpandedData): unknown {
    const value = content.value;
    if (value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(shrink);
    }
    if (typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const key in value) {
            result[key] = shrink((value as Record<string, ExpandedData>)[key]);
        }
        return result;
    }
    return value;
}
