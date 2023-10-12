# cryos
WebGPU Graphics Library

## rendering

    Context
        Pipelines
            VertexInput
            VertexOutput
            Uniforms        set
            Draw            call


## bind groups

    https://toji.dev/webgpu-best-practices/bind-groups.html

    A bind group:
    - is set with a single call during rendering pass
    - can contain multiple bind entries

    A bind entry:
    - binds a single resource

    A bound resource is one of:
    - GPUBufferBinding
    - GPUSampler
    - GPUTextureView
    - GPUExternalTexture

    A buffer binding may be:
    - A uniform value/structure
    - A storage buffer

