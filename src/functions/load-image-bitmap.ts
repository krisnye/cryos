
export async function loadImageBitmap(source: string | Blob, colorSpaceConversion = false) {
    const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
    return await createImageBitmap(blob, { colorSpaceConversion: colorSpaceConversion ? "default" : "none" })
}