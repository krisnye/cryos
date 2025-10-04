import { html, LitElement, TemplateResult, css, CSSResult } from "lit";
import { customElement } from "lit/decorators.js";
import { withHooks, useObservableValues, useEffect, useState } from "@adobe/data/lit";
import { createQueryState } from "@adobe/data/observe";

interface SampleDefinition {
    name: string;
    render: () => TemplateResult;
}

const samples: Record<string, SampleDefinition> = {
    "hello-model": {
        name: "Hello Model",
        render: () => {
            import("./hello-model/hello-model-application.js");
            return html`<hello-model-application></hello-model-application>`;
        }
    },
    "twixt": {
        name: "Twixt",
        render: () => {
            import("./twixt/twixt-application.js");
            return html`<twixt-application></twixt-application>`;
        }
    },
} as const;

type SampleKeys = keyof typeof samples;

const [sample, setSample] = createQueryState<SampleKeys | null>("sample", null);

@customElement("voxel-sample-container")
export class SampleContainer extends LitElement {
    static override styles: CSSResult = css`
        :host {
            display: block;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .title {
            font-size: 2.5rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 2rem;
            text-align: center;
        }

        nav {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
        }

        a {
            color: #3498db;
            text-decoration: none;
            font-size: 1.2rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            transition: all 0.2s ease;
            background: #f8f9fa;
            border: 2px solid transparent;
            min-width: 200px;
            text-align: center;
        }

        a:hover {
            background: #e9ecef;
            border-color: #3498db;
            transform: translateY(-2px);
        }

        a:active {
            transform: translateY(0);
        }
    `;

    @withHooks
    override render(): TemplateResult {
        const values = useObservableValues(() => ({
            sample
        })) ?? { sample: null };

        if (!values.sample) {
            return html`
                <h1 class="title">Voxel Samples</h1>
                <nav>
                    ${Object.entries(samples).map(([key, value]) => 
                        html`<a href="#" @click=${(e: Event) => {
                            e.preventDefault();
                            setSample(key as SampleKeys);
                        }}>${value.name}</a>`
                    )}
                </nav>
            `;
        }

        const { render } = samples[values!.sample!];
        return render();
    }
}
