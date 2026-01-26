import { html } from "lit";

export const volumeModelSample = () => {
    import("./volume-model-sample-element.js");
    return html`<volume-model-sample></volume-model-sample>`;
}