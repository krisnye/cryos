import { createVertexBufferLayoutNamed } from "./functions.js";

export const positionColor = createVertexBufferLayoutNamed({
    position: "float32x4",
    color: "float32x4"
})
