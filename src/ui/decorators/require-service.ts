import { PropertyValues } from "lit";
import { ServiceElement } from "../elements";
import { ServiceApplication } from "../elements";
import { Service } from "services";

export function requireService() {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalRender = descriptor.value;

        descriptor.value = function (this: any) {
            if (!this.service) {
                return null;
            }
            return originalRender.call(this);
        };

        return descriptor;
    };
} 