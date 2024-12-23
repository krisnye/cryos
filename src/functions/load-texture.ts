import { loadImageBitmap } from "./load-image-bitmap.js";

type ImageSource = ImageData | Blob | string;

export async function loadTexture(
    context: {
        device: GPUDevice;
        configuration: GPUCanvasConfiguration;
    },
    source: ImageSource,
    options: {
        flipY?: boolean;
        format?: GPUTextureFormat;
    } = {}
): Promise<GPUTexture> {
    const { flipY = true, format = context.configuration.format } = options;
    const bitmap = source instanceof ImageData ? source : await loadImageBitmap(source);
    const texture = context.device.createTexture({
        size: {
            width: bitmap.width,
            height: bitmap.height,
            depthOrArrayLayers: 1
        },
        format,
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST | 
            GPUTextureUsage.RENDER_ATTACHMENT,
    });
    context.device.queue.copyExternalImageToTexture(
        { source: bitmap, flipY },
        { texture },
        { width: bitmap.width, height: bitmap.height }
    );

    return texture;
}