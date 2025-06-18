export function isAsyncGenerator<T>(value: any): value is AsyncGenerator<T> {
    return value && typeof value[Symbol.asyncIterator] === 'function';
}
