
import { Factory, html } from "lithos/index"
import { FirstTriangle } from "./01_FirstTriangle.js";
import { BindGroups } from "./02_BindGroups.js";
import { GLTFMesh } from "./03_GLTFMesh.js";
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
    "3 GLTF Mesh": GLTFMesh,
    "2 Bind Groups": BindGroups,
    "1 First Triangle": FirstTriangle,
}

Object.entries(samples).forEach(entry => addSample(...entry))

