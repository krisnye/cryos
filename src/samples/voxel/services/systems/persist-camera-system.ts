import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { createPersistedState, toPromise } from "@adobe/data/observe";
import type { Camera } from "graphics/camera/camera.js";

const CAMERA_STORAGE_KEY = "voxel-camera-state";

export const persistCameraSystem = ({ store, database }: MainService): System[] => {
    // Create persisted state for camera with default values
    const [observeCamera, setCamera] = createPersistedState<Camera>(
        CAMERA_STORAGE_KEY,
        store.resources.camera
    );

    toPromise(observeCamera).then((camera) => {
        store.resources.camera = camera;
    });
    
    // Set up observer to persist camera changes
    database.observe.resources.camera((camera) => {
        setCamera(camera);
    });

    return [];
}; 