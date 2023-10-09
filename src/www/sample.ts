
import { Factory, html } from "lithos/index"
import { FirstTriangle } from "./01_FirstTriangle/01_FirstTriangle.js";
import { BindGroups } from "./02_BindGroups/02_BindGroups.js";
import { GLTFMesh } from "./03_GLTFMesh/03_GLTFMesh.js";
import { Compute } from "./04_Compute/04_Compute.js";
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
    "4 Compute": Compute,
    "3 GLTF Mesh": GLTFMesh,
    "2 Bind Groups": BindGroups,
    "1 First Triangle": FirstTriangle,
}

Object.entries(samples).forEach(entry => addSample(...entry))

