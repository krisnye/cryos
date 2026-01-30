import { html } from "lit";

export const gridWorldSample = () => {
    import("./grid-world-sample-element.js");
    return html`<grid-world-sample></grid-world-sample>`;
}

