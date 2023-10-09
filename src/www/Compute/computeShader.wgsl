//  input, output provided by VolumePipeline.create

fn getIndex(num_workgroups: vec3u, id: vec3u) -> u32 {
    return (id.z * num_workgroups.y + id.y) * num_workgroups.x + id.x;
}
fn isAlive(
    num_workgroups : vec3u,
    id: vec3u,
    dx: i32, dy: i32, dz: i32,
) -> u32 {
    let ix = i32(id.x) + dx;
    let iy = i32(id.y) + dy;
    let iz = i32(id.z) + dz;
    if (ix < 0 || ix >= i32(num_workgroups.x) || iy < 0 || iy >= i32(num_workgroups.y) || iz < 0 || iz >= i32(num_workgroups.z)) {
        return 0;
    }
    let fromIndex = getIndex(num_workgroups, vec3u(u32(ix), u32(iy), u32(iz)));
    return input[fromIndex];
}

@compute @workgroup_size(1)
fn main(
    @builtin(workgroup_id) workgroup_id : vec3u,
    @builtin(num_workgroups) num_workgroups : vec3u,
) {
    //  this should give me index into volume data
    let index = getIndex(num_workgroups, workgroup_id);
    let wasAlive = input[index];
    let nearbyAlive
        = isAlive(num_workgroups, workgroup_id, -1, -1, 0)  //  top left
        + isAlive(num_workgroups, workgroup_id, -1,  0, 0)  //  top
        + isAlive(num_workgroups, workgroup_id, -1,  1, 0)  //  top right
        + isAlive(num_workgroups, workgroup_id,  0, -1, 0)  //  left
        + isAlive(num_workgroups, workgroup_id,  0,  1, 0)  //  right
        + isAlive(num_workgroups, workgroup_id,  1, -1, 0)  //  right top
        + isAlive(num_workgroups, workgroup_id,  1,  0, 0)  //  right
        + isAlive(num_workgroups, workgroup_id,  1,  1, 0); //  right bottom
    if (((wasAlive == 1 && (nearbyAlive == 2 || nearbyAlive == 3)) || (wasAlive == 0 && nearbyAlive == 3))) {
        output[index] = 1;
    }
    else {
        output[index] = 0;
    }
}
