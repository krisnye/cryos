
import { Factory, html } from "lithos/index"
import { FirstTriangle } from "./FirstTriangle/FirstTriangle.js";
import { BindGroups } from "./BindGroups/BindGroups.js";
import { GLTFMesh } from "./GLTFMesh/GLTFMesh.js";
import { Compute } from "./Compute/Compute.js";
import { Instancing } from "./Instancing/Instancing.js";
const { H2, P, Section } = html;

function addSample(name: string, sample: () => Factory<HTMLElement>) {
    document.body.appendChild(Section(
        H2(name),
        P(
            sample()
        )
    ).build())
}

const samples = {
    "5 Compute": Compute,
    "4 GLTF Mesh": GLTFMesh,
    "3 Instancing": Instancing,
    "2 Bind Groups": BindGroups,
    "1 First Triangle": FirstTriangle,
}

Object.entries(samples).forEach(entry => addSample(...entry))

