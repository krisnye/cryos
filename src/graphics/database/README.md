what is a graphics database?

an ecs database that declares structures that can be used for rendering.
a data oriented approach to rendering advanced graphics.

could do vertex buffer based rendering
could do storage buffer based rendering, let's start with this

the graphics database does not have to be the same database as the main application
it could be extended with other components and resources

## Thinking on Small, Fast Rendering

<!--
Minimal Billboard rendering.
    position: vec3
    scale: f32
    color: vec4
    -- total: 32 bytes --

Minimal Voxel rendering.
    position: vec3
    scale: f32
    color: vec4
    -- total: 32 bytes --
-->

<!-- Non uniformly Scaled Voxel rendering.
    position: vec3
    scale: vec3
    color: vec4
    -- total: 40 bytes -- -->

Transformed Geometry Model rendering.
    position: vec3
    rotation: vec4
    scale: vec3
    color: vec4
    -- total: 56 bytes --

<!-- Shader Geometry Model rendering.
    position: vec3
    rotation: vec4
    scale: vec3
    -- total: 40 bytes -- -->

Could avoid color if we had a buffer of type colors.
