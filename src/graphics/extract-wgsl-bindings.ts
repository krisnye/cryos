
export function extractWGSLBindings(wgsl: string): { name: string; binding: number; group: number }[] {
    const regex = /@binding\((\d+)\)\s+@group\((\d+)\)\s+var<[^>]+>\s+(\w+)\s*:/g;
    const result = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(wgsl))) {
      result.push({ name: match[3], binding: +match[1], group: +match[2] });
    }
    return result;
}
  