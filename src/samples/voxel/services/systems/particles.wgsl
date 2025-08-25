
struct Scene {
    viewProjection: mat4x4<f32>,
    lightDirection: vec3<f32>,
    ambientStrength: f32,
    lightColor: vec3<f32>,
    time: f32,
    hoverPosition: vec3<f32>,
    hoverFace: u32,
}

// in Javascript we use position_scale a vec4, but this WGSL struct layout is same shape, scale packed after vec3 position.
struct PositionScale {
    position: vec3<f32>,
    scale: f32,
}

const CUBE_SIZE = 0.5;
const INVISIBLE_POSITION = vec3<f32>(99999.0, 99999.0, 99999.0);

@binding(0) @group(0) var<uniform> scene: Scene;
@binding(1) @group(0) var<storage, read> position_scales: array<PositionScale>;
@binding(2) @group(0) var<storage, read> colors: array<vec4<f32>>;
@binding(3) @group(0) var<storage, read> flags: array<u32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) worldPos: vec3<f32>,
    @location(3) isSelected: f32, // Pass selection state to fragment shader
    @location(4) instancePos: vec3<f32>, // Pass instance position for hover comparison
    @location(5) faceIndex: f32, // Pass face index for hover face comparison
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32,
              @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    // Define cube vertices (8 vertices forming a cube)
    var pos = array<vec3<f32>, 8>(
        // Front face vertices
        vec3<f32>(-CUBE_SIZE, -CUBE_SIZE,  CUBE_SIZE),  // bottom-left-front
        vec3<f32>( CUBE_SIZE, -CUBE_SIZE,  CUBE_SIZE),  // bottom-right-front
        vec3<f32>( CUBE_SIZE,  CUBE_SIZE,  CUBE_SIZE),  // top-right-front
        vec3<f32>(-CUBE_SIZE,  CUBE_SIZE,  CUBE_SIZE),  // top-left-front
        // Back face vertices
        vec3<f32>(-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE),  // bottom-left-back
        vec3<f32>( CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE),  // bottom-right-back
        vec3<f32>( CUBE_SIZE,  CUBE_SIZE, -CUBE_SIZE),  // top-right-back
        vec3<f32>(-CUBE_SIZE,  CUBE_SIZE, -CUBE_SIZE)   // top-left-back
    );

    // Define indices for the cube (36 indices for 12 triangles)
    var indices = array<u32, 36>(
        // Front face
        0, 1, 2,  0, 2, 3,
        // Right face
        1, 5, 6,  1, 6, 2,
        // Back face
        5, 4, 7,  5, 7, 6,
        // Left face
        4, 0, 3,  4, 3, 7,
        // Top face
        3, 2, 6,  3, 6, 7,
        // Bottom face
        4, 5, 1,  4, 1, 0
    );

    // Define normals for each face (will be used based on vertex index)
    var normals = array<vec3<f32>, 6>(
        vec3<f32>(0.0, 0.0, 1.0),   // Front
        vec3<f32>(1.0, 0.0, 0.0),   // Right
        vec3<f32>(0.0, 0.0, -1.0),  // Back
        vec3<f32>(-1.0, 0.0, 0.0),  // Left
        vec3<f32>(0.0, 1.0, 0.0),   // Top
        vec3<f32>(0.0, -1.0, 0.0)   // Bottom
    );
    
    let faceIndex = vertexIndex / 6u; // 0:Front, 1:Right, 2:Back, 3:Left, 4:Top, 5:Bottom
    let faceMask = 1u << faceIndex;
    
    // Check if face is invisible (bits 0-5)
    let invisible = (flags[instanceIndex] & faceMask) != 0u;
    
    // Check if face is selected (bits 6-11)
    let selectedFaceMask = 1u << (faceIndex + 6u);
    let isSelected = (flags[instanceIndex] & selectedFaceMask) != 0u;

    var scale = position_scales[instanceIndex].scale;
    var worldPos = position_scales[instanceIndex].position + pos[indices[vertexIndex]] * scale;
    if (invisible) {
        worldPos = INVISIBLE_POSITION;
    }

    var output: VertexOutput;
    output.position = scene.viewProjection * vec4<f32>(worldPos, 1.0);
    output.color = colors[instanceIndex].rgb;
    output.worldPos = worldPos;
    output.instancePos = position_scales[instanceIndex].position;
    // Calculate which face we're on and use appropriate normal
    output.normal = normals[faceIndex];
    output.faceIndex = f32(faceIndex);
    
    // Set selection state based on face selection
    if (isSelected) {
        output.isSelected = 1.0;
    } else {
        output.isSelected = 0.0;
    }
    
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let normal = normalize(input.normal);
    
    // Use light direction directly since it's already in world space and pointing from light to surface
    let lightDir = normalize(scene.lightDirection);
    
    // Calculate diffuse lighting (no attenuation for directional light)
    let diff = max(dot(normal, lightDir), 0.0);
    let diffuse = scene.lightColor * diff;
    
    // Add ambient light
    let ambient = scene.lightColor * scene.ambientStrength;
    
    // Modify color based on selection state
    var finalColor = input.color;
    let isHovering = all(scene.hoverPosition == input.instancePos) && (scene.hoverFace == u32(input.faceIndex));
    let isSelected = input.isSelected > 0.5;
    if (isHovering || isSelected) {
        // Create checkerboard pattern for selected faces
        var checkerSize: f32;
        if (isHovering) {
            if (isSelected) {
                checkerSize = 0.06;
            } else {
                checkerSize = 0.08;
            }
        } else {
            checkerSize = 0.1;
        }

        // Get world position and create checkerboard pattern
        let worldPos = input.worldPos;
        let checkerX = floor(worldPos.x / checkerSize);
        let checkerY = floor(worldPos.y / checkerSize);
        let checkerZ = floor(worldPos.z / checkerSize);
        
        // Create alternating pattern based on position
        let checkerPattern = (checkerX + checkerY + checkerZ) % 2.0;
        
        // Apply black checkerboard (0.0 = black, 1.0 = original color)
        if (checkerPattern < 0.5) {
            finalColor = vec3<f32>(0.0, 0.0, 0.0); // Black squares
        }
        // else keep original color for white squares
    }
    
    // let r = select(0.0, 1.0, scene.hoverFace == 0); // Red for front
    // let g = select(0.0, 1.0, scene.hoverFace == 1); // Green for right  
    // let b = select(0.0, 1.0, scene.hoverFace == 2); // Blue for back
    
    // return vec4<f32>(r, g, b, 1.0);
    
    // Combine lighting with modified vertex color
    let result = (ambient + diffuse) * finalColor;
    return vec4<f32>(result, 1.0);
} 