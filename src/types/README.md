
## Should we be a complete wrapper around the GPU API?

No. The API already has good types, we just want to simplify the hard parts and provide better type checking.

## Should we use separate calls for rendering or a declarative structure for a full frame?

Declarative, because it makes it easier to handle copying dirty resources to the GPU before render pass automatically.

## Should we use mutable DOM structures or declarative JSON structures?

Mutable DOM structures as we can cache buffers for performance.

## How do we know which bind groups to split the resources into?

Just use a single bind group for all resources for now.
Later, analyze based upon number of render calls to the shader and which resources are changing.

