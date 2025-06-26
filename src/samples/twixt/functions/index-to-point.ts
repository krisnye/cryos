// Convert board index to x,y coordinates (0,0 is top-left)
export const indexToPoint = (index: number, size: number): [number, number] => {
    const x = index % size;
    const y = Math.floor(index / size);
    return [x, y];
};
