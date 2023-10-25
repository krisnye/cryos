import { GPUContext } from "./GPUContext.js";

// type GPUImageCopyExternalImageSource = ImageBitmap | ImageData | HTMLImageElement | HTMLVideoElement | VideoFrame | HTMLCanvasElement | OffscreenCanvas
type GPUTextureHelperSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas

const samplerLayout = { "type": "filtering" } satisfies GPUSamplerBindingLayout
const textureLayout = { sampleType: "float", viewDimension: "2d" } satisfies GPUTextureBindingLayout

export class GPUTextureHelper {

    private dirty = true

    constructor(
        private readonly context: GPUContext,
        private _source: GPUTextureHelperSource,
        public sampler: GPUSampler = context.device.createSampler(),
        public readonly texture = context.device.createTexture({
            format: 'rgba8unorm',
            size: [_source.width, _source.height],
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        })
    ) {
    }

    static getBindGroupLayoutEntries(firstBindingIndex: number) {
        return [
            { binding: firstBindingIndex + 0, sampler: samplerLayout, visibility: GPUShaderStage.FRAGMENT },
            { binding: firstBindingIndex + 1, texture: textureLayout, visibility: GPUShaderStage.FRAGMENT },
        ]
    }

    getBindGroupEntries(firstBindingIndex: number) {
        return [
            { binding: firstBindingIndex + 0, resource: this.sampler },
            { binding: firstBindingIndex + 1, resource: this.createView() },
        ]
    }

    createView() {
        return this.texture.createView()
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

    commandCopyToGPU() {
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
