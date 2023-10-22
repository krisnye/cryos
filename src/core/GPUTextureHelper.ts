import { GPUContext } from "./GPUContext.js";

const PAD_SIZE = 16

// type GPUImageCopyExternalImageSource = ImageBitmap | ImageData | HTMLImageElement | HTMLVideoElement | VideoFrame | HTMLCanvasElement | OffscreenCanvas
type GPUTextureHelperSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas

export class GPUTextureHelper {

    public readonly texture: GPUTexture;
    private dirty = true

    constructor(
        private readonly context: GPUContext,
        private _source: GPUTextureHelperSource
    ) {
        this.texture = context.device.createTexture({
            format: 'rgba8unorm',
            size: [_source.width, _source.height],
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        })
    }

    public destroy() {
        this.texture.destroy()
    }

    /**
     * Sets the source data for this texture.
     * You will still have to call commandCopyToBuffer before rendering
     * to copy the source to the GPUTexture.
     */
    public set source(value: GPUTextureHelperSource) {
        this.source = value
        this.dirty = true
    }

    public get source() {
        return this._source
    }

    commandCopyToTexture() {
        if (this.dirty) {
            this.context.device.queue.copyExternalImageToTexture(
                { source: this._source, flipY: true },
                { texture: this.texture },
                { width: this._source.width, height: this._source.height },
            );
            this.dirty = false
        }
    }

}
