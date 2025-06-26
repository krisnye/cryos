// Convert coordinates to SVG viewBox space (0,0 is top-left, size-1,size-1 is bottom-right)
export const pointToSvgSpace = (coords: [number, number], size: number): [number, number] => {
    return [coords[0], coords[1]];
}; 