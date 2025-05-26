// import { GraphicsDatabase } from "graphics";
import { LitElement } from "lit";
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { withHooks } from "ui/hooks/with-hooks";
import "graphics/ecs/graphics-canvas";

@customElement("graphics-tutorials")
export class GraphicsTutorials extends LitElement {

    // init(db: GraphicsDatabase) {
    //     // console.log("init", db);
    // }

    @withHooks
    override render() {
        return html`
            <div>
                <h1>Graphics Tutorials</h1>
            </div>
            `;
    }
    // <!-- <graphics-canvas .init=${this.init} style="width: 640px; height: 400px; border: 1px solid red;"></graphics-canvas> -->

}
