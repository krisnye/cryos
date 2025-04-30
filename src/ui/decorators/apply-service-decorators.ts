import { withHooks } from "../hooks/with-hooks";
import { requireService } from "./require-service";
import { TemplateResult } from "lit";

export function applyServiceDecorators(target: any) {
    const prototype = Object.getPrototypeOf(target);
    const originalRender = prototype.render;
    const withService = requireService()(target, 'render', {
        value: originalRender
    });
    const withHooksAndService = withHooks(target, 'render', withService);
    target.render = withHooksAndService.value as () => TemplateResult | null;
} 