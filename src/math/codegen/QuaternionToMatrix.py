from sympy import Symbol

def quaternion(name):
    return [
        Symbol(name + "x"),
        Symbol(name + "y"),
        Symbol(name + "z"), 
        Symbol(name + "w"),
    ]

def inverse(r):
    return [
        - r[0],
        - r[1],
        - r[2],
        r[3],
    ]
    
def multiply(L, R):
    Lx = L[0]
    Ly = L[1]
    Lz = L[2]
    Lw = L[3]

    Rx = R[0]
    Ry = R[1]
    Rz = R[2]
    Rw = R[3]

    x = Lx * Rw + Lw * Rx + Ly * Rz - Lz * Ry
    y = Ly * Rw + Lw * Ry + Lz * Rx - Lx * Rz
    z = Lz * Rw + Lw * Rz + Lx * Ry - Ly * Rx
    w = Lw * Rw - Lx * Rx - Ly * Ry - Lz * Rz

    return [x, y, z, w]

def rotate(r, v):
    return multiply(multiply(inverse(r), v), r)

q = quaternion("q.")

bases = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
]

# Print in column major order.
for basis in bases:
    print( rotate( q, basis ) )
