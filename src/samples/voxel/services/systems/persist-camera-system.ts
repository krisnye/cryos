import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { createPersistedState, toPromise } from "@adobe/data/observe";
import type { Camera } from "graphics/camera/camera.js";
import { equals } from "@adobe/data";

const CAMERA_STORAGE_KEY = "voxel-camera-state";

export const persistCameraSystem = ({ store, database }: MainService): System[] => {
    const defaultCamera = store.resources.camera;
    // Create persisted state for camera with default values
    const [observeCamera, setCamera] = createPersistedState<Camera>(
        CAMERA_STORAGE_KEY,
        defaultCamera
    );

    toPromise(observeCamera).then((camera) => {
        store.resources.camera = camera;
    });
    
    // Set up observer to persist camera changes
    database.observe.resources.camera((camera) => {
        if (!equals(camera, defaultCamera)) {
            setCamera(camera);
        }
    });

    return [];
}; 