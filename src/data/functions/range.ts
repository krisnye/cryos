export function* range(end: number) {
    for (let i = 0; i < end; i++) {
        yield i;
    }
} 