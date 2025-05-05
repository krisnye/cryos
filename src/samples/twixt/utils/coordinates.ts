// Convert board index to x,y coordinates (0,0 is top-left)
export const indexToCoords = (index: number, size: number): [number, number] => {
    const x = index % size;
    const y = Math.floor(index / size);
    return [x, y];
};

// Convert coordinates to SVG viewBox space (0,0 is top-left, size-1,size-1 is bottom-right)
export const coordsToSvgSpace = (coords: [number, number], size: number): [number, number] => {
    return [coords[0], coords[1]];
}; 