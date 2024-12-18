import { Factory, html } from "lithos/index"
import { FirstTriangle } from "./FirstTriangle/FirstTriangle.js"
import { Compute } from "./Compute/Compute.js"
import { Instancing } from "./Instancing/Instancing.js"
import { GPUMeshSample } from "./GPUMeshSample/GPUMeshSample.js"
import { TextureSample } from "./TextureSample/TextureSample.js"
const { H2, P, Section } = html

function addSample(name: string, sample: () => Factory<HTMLElement>) {
    document.body.appendChild(
        Section(
            H2(name),
            P(
                sample()
            )
        ).build()
    )
}

const samples = {
    "1 New Triangle": FirstTriangle,
    "2 New Textures": TextureSample,
    "3 Instancing": Instancing,
    "4 Compute": Compute,
    "5 GPU Mesh": GPUMeshSample,
}

Object.entries(samples).forEach(entry => addSample(...entry))

