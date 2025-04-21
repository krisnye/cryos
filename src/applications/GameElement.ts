import { LitElement } from 'lit';
import type { TemplateResult, nothing } from 'lit';
// import { findAncestor } from '../../functions/dom-functions.js';
// import { withHooks } from '../../hooks/with-hooks.js';
// import { attachDecorator } from '../../functions/index.js';

export abstract class ApplicationElement<MainService> extends LitElement {

    constructor() {
        super();
    }

    // connectedCallback(): void {
    //     super.connectedCallback();
    //     if (!this.service) {
    //         const ancestorElementWithService = findAncestor(this, (element) => "service" in element) as ApplicationElement<MainService> | null;
    //         if (!ancestorElementWithService) {
    //             throw new Error("No ancestor element with service found");
    //         }
    //         this.service = ancestorElementWithService.service;
    //     }
    // }

    // disconnectedCallback(): void {
    //     super.disconnectedCallback();
    //     this.service = undefined as any;
    // }

    public service!: MainService;

    abstract render(): TemplateResult | typeof nothing;

}
