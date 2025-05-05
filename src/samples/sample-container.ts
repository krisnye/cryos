import { html, LitElement, TemplateResult, css } from "lit";
import { customElement } from "lit/decorators.js";
import "./service-sample";
import "./twixt";
import { withHooks } from "ui/hooks/with-hooks";
import { useObservableValues } from "ui/hooks/use-observable-values";
import { createQueryState } from "data/observe/create-query-state";

interface SampleDefinition {
    name: string;
    load: () => Promise<unknown>;
    render: () => TemplateResult;
}

const samples: Record<string, SampleDefinition> = {
    "service": {
        name: "Service Sample",
        load: () => import("./service-sample"),
        render: () => html`<cryos-service-sample></cryos-service-sample>`
    },
    "twixt": {
        name: "Twixt",
        load: () => import("./twixt"),
        render: () => html`<twixt-game></twixt-game>`
    }
} as const;

type SampleKeys = keyof typeof samples;

const [sample, setSample] = createQueryState<SampleKeys | null>("sample", null);

@customElement("cryos-sample-container")
export class SampleContainer extends LitElement {
    static override styles = css`
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
    override render() {
        const values = useObservableValues(() => ({
            sample
        })) ?? { sample: null };

        if (!values.sample) {
            return html`
                <h1 class="title">Cryos Samples</h1>
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

        return samples[values.sample].render();
    }
}
