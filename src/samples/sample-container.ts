import { html, LitElement, TemplateResult, css, CSSResult } from "lit";
import { customElement } from "lit/decorators.js";

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
    "particle-sample": {
        name: "Particle Sample",
        render: () => {
            import("./particle-sample/particle-sample-application.js");
            return html`<particle-sample-application></particle-sample-application>`;
        }
    },
} as const;

type SampleKeys = keyof typeof samples;

@customElement("cryos-sample-container")
export class SampleContainer extends LitElement {
    private currentSample: SampleKeys | null = null;

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

    override connectedCallback(): void {
        super.connectedCallback();
        const urlParams = new URLSearchParams(window.location.search);
        const sampleParam = urlParams.get("sample");
        if (sampleParam && sampleParam in samples) {
            this.currentSample = sampleParam as SampleKeys;
        }
        this.requestUpdate();
    }

    override render(): TemplateResult {
        if (!this.currentSample) {
            return html`
                <h1 class="title">Cryos Samples</h1>
                <nav>
                    ${Object.entries(samples).map(([key, value]) => 
                        html`<a href="#" @click=${(e: Event) => {
                            e.preventDefault();
                            this.currentSample = key as SampleKeys;
                            window.history.pushState({}, "", `?sample=${key}`);
                            this.requestUpdate();
                        }}>${value.name}</a>`
                    )}
                </nav>
            `;
        }

        const { render } = samples[this.currentSample];
        return render();
    }
}

