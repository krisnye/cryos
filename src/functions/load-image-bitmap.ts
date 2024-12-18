
export async function loadImageBitmap(url: string, colorSpaceConversion = false) {
    const res = await fetch(url)
    const blob = await res.blob()
    return await createImageBitmap(blob, { colorSpaceConversion: colorSpaceConversion ? "default" : "none" })
}