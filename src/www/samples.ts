import { Factory, html } from "lithos/index"
import { FirstTriangle } from "./FirstTriangle/FirstTriangle.js"
import { Compute } from "./Compute/Compute.js"
import { Instancing } from "./Instancing/Instancing.js"
import { GPUMeshSample } from "./GPUMeshSample/GPUMeshSample.js"
import { TextureSample } from "./TextureSample/TextureSample.js"
import { Storage } from "./Storage/Storage.js"
import { NewCompute } from "./NewCompute/NewCompute.js"
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
    // "6 GPU Mesh": GPUMeshSample,
    // "5 Compute": Compute,
    "5 New Compute": NewCompute,
    "4 New Storage": Storage,
    "3 New Instancing": Instancing,
    "2 New Textures": TextureSample,
    "1 New Triangle": FirstTriangle,
}

Object.entries(samples).forEach(entry => addSample(...entry))

