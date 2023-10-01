
import { Factory, html } from "lithos/index"
import { FirstTriangle } from "../FirstTriangle.js";
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
    "FirstTriangle": FirstTriangle
}

Object.entries(samples).forEach(entry => addSample(...entry))

