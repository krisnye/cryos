import { html } from "lit";

export const particleSample = () => {
    import("./particle-sample-element.js");
    const loadingStyle = `
        background-color: white; 
        width: 800px; 
        height: 600px; 
        display: block;
        border: 1px solid black;
    `;
    return html`<particle-sample style=${loadingStyle}>Loading...</particle-sample>`;
}