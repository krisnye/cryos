import { createAxis } from "graphics/database/index.js";
import { HelloModelStore } from "../hello-model-store.js";
import { createCircleModel } from "graphics/database/transactions/create-circle-model.js";
import { Quat } from "@adobe/data/math";
export const createTestModels = (t: HelloModelStore) => {   
    createAxis(t);

    // Circle in XY plane (red + green = yellow)
    createCircleModel(t, {
        position: [0, 0, 0],
        color: [1, 1, 0, 1], // Red + Green = Yellow
        radius: 10,
        scale: [0.10, 0.10, 0.10],
        rotation: Quat.fromAxisAngle([1, 0, 0], (0 * Math.PI / 10)) // Rotate 90° around X-axis
    });

    // Circle in XZ plane (red + blue = magenta)
    createCircleModel(t, {
        position: [0, 0, 0.1], // Slightly offset in Z to avoid depth conflict
        color: [1, 0, 1, 1], // Red + Blue = Magenta
        radius: 10,
        scale: [0.10, 0.10, 0.10],
        rotation: Quat.fromAxisAngle([1, 0, 0], Math.PI / 2) // Rotate 90° around X-axis
    });

    // Circle in YZ plane (green + blue = cyan)
    createCircleModel(t, {
        position: [0, 0, 0.2], // Slightly offset in Z to avoid depth conflict
        color: [0, 1, 1, 1], // Green + Blue = Cyan
        radius: 10,
        scale: [0.10, 0.10, 0.10],
        rotation: Quat.fromAxisAngle([0, 1, 0], - Math.PI / 2) // Rotate -90° around X-axis to get YZ plane
    });
}