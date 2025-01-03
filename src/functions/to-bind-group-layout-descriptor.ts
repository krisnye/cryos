import { 
  GraphicShaderDescriptor, 
  isComputeShaderDescriptor,
  isGraphicShaderDescriptor, 
  ShaderDescriptor
} from "../types/shader-types.js";
import { parseComputeStorageAccess } from "./parse-shader-access.js";

interface ShaderStageUsage {
  vertex: boolean;
  fragment: boolean;
}

function parseShaderUsage(source: string, resourceNames: string[]): Record<string, ShaderStageUsage> {
  const usage: Record<string, ShaderStageUsage> = {};

  // Initialize usage tracking for all resources
  resourceNames.forEach(name => {
    usage[name] = { vertex: false, fragment: false };
  });

  // Updated regex patterns to handle decorators and complex parameter lists
  const vertexMatch = source.match(/fn\s+vertex_main\s*\([^{]*\)[^{]*{([^}]*)}/);
  if (!vertexMatch) {
    console.warn("Vertex shader not found");
  }
  const fragmentMatch = source.match(/fn\s+fragment_main\s*\([^{]*\)[^{]*{([^}]*)}/);
  if (!fragmentMatch) {
    console.warn("Fragment shader not found");
  }

  // Check usage in vertex shader
  if (vertexMatch) {
    const vertexCode = vertexMatch[1];
    resourceNames.forEach(name => {
      if (vertexCode.includes(name)) {
        usage[name].vertex = true;
      }
    });
  }

  // Check usage in fragment shader
  if (fragmentMatch) {
    const fragmentCode = fragmentMatch[1];
    resourceNames.forEach(name => {
      if (fragmentCode.includes(name)) {
        usage[name].fragment = true;
      }
    });
  }

  return usage;
}

function getVisibilityForResource(usage: ShaderStageUsage): GPUShaderStageFlags {
  let visibility = 0;
  if (usage.vertex) visibility |= GPUShaderStage.VERTEX;
  if (usage.fragment) visibility |= GPUShaderStage.FRAGMENT;
  return visibility;
}

interface UnusedResourceError {
  type: 'uniforms' | 'textures' | 'samplers' | 'storage';
  name: string;
}

const findUnusedResources = (
  usage: Record<string, ShaderStageUsage>,
  descriptor: GraphicShaderDescriptor,
  propertyName: keyof Pick<GraphicShaderDescriptor, 'uniforms' | 'textures' | 'samplers' | 'storage'>
): UnusedResourceError[] => {
  const resources = descriptor[propertyName];
  return resources 
    ? Object.keys(resources)
        .filter(name => getVisibilityForResource(usage[name]) === 0)
        .map(name => ({ type: propertyName, name }))
    : [];
};

export function toBindGroupLayoutDescriptor(
  descriptor: ShaderDescriptor
): GPUBindGroupLayoutDescriptor {
  const entries: GPUBindGroupLayoutEntry[] = [];
  let bindingIndex = 0;

  if (isComputeShaderDescriptor(descriptor)) {
    // Handle compute shader resources
    const resourceNames = [
      ...Object.keys(descriptor.uniforms ?? {}),
      ...Object.keys(descriptor.storage ?? {}),
    ];

    const storageAccess = parseComputeStorageAccess(
      descriptor.source, 
      Object.keys(descriptor.storage ?? {})
    );

    // Handle uniforms
    if (descriptor.uniforms && Object.keys(descriptor.uniforms).length > 0) {
      entries.push({
        binding: bindingIndex++,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" }
      });
    }

    // Handle storage buffers
    if (descriptor.storage) {
      const storageAccess = parseComputeStorageAccess(descriptor.source, Object.keys(descriptor.storage));
      Object.keys(descriptor.storage).forEach((name) => {
        const access = storageAccess[name];
        entries.push({
          binding: bindingIndex++,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: access.write ? "storage" : "read-only-storage",
            hasDynamicOffset: false,
          }
        });
      });
    }
  } else if (isGraphicShaderDescriptor(descriptor)) {
    // Handle graphics shader resources
    const resourceNames = [
      ...Object.keys(descriptor.uniforms ?? {}),
      ...Object.keys(descriptor.textures ?? {}),
      ...Object.keys(descriptor.samplers ?? {}),
      ...Object.keys(descriptor.storage ?? {}),
    ];

    const usage = parseShaderUsage(descriptor.source, resourceNames);

    // Check for unused resources
    const unusedResources = [
      ...findUnusedResources(usage, descriptor, 'uniforms'),
      ...findUnusedResources(usage, descriptor, 'textures'),
      ...findUnusedResources(usage, descriptor, 'samplers'),
      ...findUnusedResources(usage, descriptor, 'storage'),
    ];

    if (unusedResources.length > 0) {
      console.warn(
        `Found unused resources in shader:\n${unusedResources
          .map(({ type, name }) => `  - ${type}: ${name}`)
          .join('\n')}`
      );
    }

    // Handle uniforms
    if (descriptor.uniforms && Object.keys(descriptor.uniforms).length > 0) {
      const uniformNames = Object.keys(descriptor.uniforms);
      const visibility = uniformNames.reduce(
        (vis, name) => vis | getVisibilityForResource(usage[name]), 
        0
      );
      
      entries.push({
        binding: bindingIndex++,
        visibility,
        buffer: { type: "uniform" }
      });
    }

    // Handle textures
    if (descriptor.textures) {
      Object.keys(descriptor.textures).forEach((name) => {
        entries.push({
          binding: bindingIndex++,
          visibility: getVisibilityForResource(usage[name]),
          texture: { sampleType: "float", viewDimension: "2d" }
        });
      });
    }

    // Handle samplers
    if (descriptor.samplers) {
      Object.keys(descriptor.samplers).forEach((name) => {
        entries.push({
          binding: bindingIndex++,
          visibility: getVisibilityForResource(usage[name]),
          sampler: { type: "filtering" }
        });
      });
    }

    // Handle storage buffers
    if (descriptor.storage) {
      Object.keys(descriptor.storage).forEach((name) => {
        const visibility = getVisibilityForResource(usage[name]);
        entries.push({
          binding: bindingIndex++,
          visibility,
          buffer: { 
            // Use read-only storage for vertex stage, regular storage for fragment stage
            type: (visibility & GPUShaderStage.VERTEX) ? "read-only-storage" : "storage",
            hasDynamicOffset: false,
          }
        });
      });
    }
  }

  return { entries };
}