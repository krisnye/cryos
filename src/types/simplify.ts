
type DontSimplify = Element | Map<any, any> | Set<any> | Array<any> | string | number | boolean | null | undefined | ((...args: any[]) => any);

type SimplifyOnce<T> = T extends DontSimplify ? T : { [K in keyof T]: SimplifyOnce<T[K]> } & {};

export type Simplify<T> = { [K in keyof T]: SimplifyOnce<T[K]> } & {};
