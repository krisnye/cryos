import { getWebGPUGraphicsContext } from "../../../data/graphics/getWebGPUDeviceAndContext";
import { MainService } from "./MainService"
import { Particle } from "../types/Particle";
import { createStateService } from "./createStateService";
import { systemsFactories } from "./systems";
import { getTerrainParticle } from "../functions/getTerrainParticle";

const initialScale = 20;

const createRandomParticle = (): Particle => {
    return {
        position: [Math.random() * initialScale - initialScale / 2, Math.random() * initialScale - initialScale / 2, 0],
        color: [Math.random(), Math.random(), Math.random(), 1],
    }
}

const createTerrainParticles = (): Particle[] => {
    const particles: Particle[] = [];
    for (let x = -initialScale; x < initialScale; x += 1) {
        for (let y = -initialScale; y < initialScale; y += 1) {
            particles.push(getTerrainParticle(x, y));
        }
    }
    return particles;
}

export const createMainService = async (canvas: HTMLCanvasElement) => {
    const graphicsContext = await getWebGPUGraphicsContext(canvas);
    const { device, context } = graphicsContext;

    const state = createStateService(graphicsContext);
    for (const systemsFactory of systemsFactories) {
        const systems = systemsFactory(state);
        state.withExtension({
            resources: {
                updateSystems: {
                    [systems.name]: systems.update,
                },
                renderSystems: {
                    [systems.name]: systems.render,
                },
            }
        })
    }

    for (const particle of createTerrainParticles()) {
        state.actions.createParticle(particle);
    }

    // Create depth texture
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    const requestFrame = () => {
        requestAnimationFrame(mainService.animateFrame);
    }

    let lastTime: number | null = null;

    const mainService = {
        state,
        click: (event: MouseEvent) => {
            state.actions.createParticle(createRandomParticle());
            requestFrame();
        },
        animateFrame: async () => {
            // let's copy from the state particles archetype to the particles buffer.
            const commandEncoder = device.createCommandEncoder();

            state.actions.update(commandEncoder);
            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                    view: context.getCurrentTexture().createView(),
                }],
                depthStencilAttachment: {
                    view: depthTexture.createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                }
            });
            state.actions.render(passEncoder);
            passEncoder.end();
            device.queue.submit([commandEncoder.finish()]);

            if (state.resources.pressedKeys.size > 0) {
                requestFrame();
            }
        },
        keydown(this, key: string) {
            state.resources.pressedKeys.add(key);
            requestFrame();
        },
        keyup(this, key: string) {
            state.resources.pressedKeys.delete(key);
            requestFrame();
        },
        blur(this) {
            state.resources.pressedKeys.clear();
        },
    }
    return mainService;
}
