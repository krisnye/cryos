struct Particle {
    position: vec3<f32>,
    color: vec4<f32>,
}

struct Scene {
    viewProjection: mat4x4<f32>,
    lightDirection: vec3<f32>,
    lightColor: vec3<f32>,
    ambientStrength: f32,
}

const CUBE_SIZE = 0.5;

@binding(0) @group(0) var<uniform> scene: Scene;
@binding(1) @group(0) var<storage, read> particles: array<Particle>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) worldPos: vec3<f32>,
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
    
    let particle = particles[instanceIndex];
    let worldPos = pos[indices[vertexIndex]] + particle.position;
    
    var output: VertexOutput;
    output.position = scene.viewProjection * vec4<f32>(worldPos, 1.0);
    output.color = particle.color.rgb;
    output.worldPos = worldPos;
    // Calculate which face we're on and use appropriate normal
    output.normal = normals[vertexIndex / 6];
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
    
    // Combine lighting with vertex color
    let result = (ambient + diffuse) * input.color;
    return vec4<f32>(result, 1.0);
} 