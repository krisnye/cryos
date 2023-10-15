
import { Factory, html } from "lithos/index"
import { FirstTriangle } from "./FirstTriangle/FirstTriangle.js"
import { Compute } from "./Compute/Compute.js"
import { Instancing } from "./Instancing/Instancing.js"
import { GPUMeshSample } from "./GPUMeshSample/GPUMeshSample.js"
const { H2, P, Section } = html

function addSample(name: string, sample: () => Factory<HTMLElement>) {
    document.body.appendChild(Section(
        H2(name),
        P(
            sample()
        )
    ).build())
}

const samples = {
    "4 GPU Mesh": GPUMeshSample,
    "3 Compute": Compute,
    "2 Instancing": Instancing,
    "1 First Triangle": FirstTriangle,
}

Object.entries(samples).forEach(entry => addSample(...entry))

