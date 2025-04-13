import { SystemsFactory } from "./SystemsFactory";
import { createAnimateCamera } from "./animateCamera/animateCamera";
import { createParticleRender } from "./particleRender/particleRender";
import { createSceneUpdate } from "./sceneUpdate/sceneUpdate";

export const systemsFactories: SystemsFactory[] = [
    createSceneUpdate,
    createParticleRender,
    createAnimateCamera,
];