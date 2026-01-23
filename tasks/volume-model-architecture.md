# Volume Model Rendering Architecture

material-vertex-buffers
  opaqueVertexBuffer: GPUBuffer
  transparentVertexBuffer: GPUBuffer

volume-model
  volumeModel: true
  materialVolume: Volume<MaterialId>

material-volume-to-vertex-buffers
  materialVolumeToVertexBuffers { reads materialVolume, writes opaqueVertexBuffer and/or transparentVertexBuffer }

material-vertex-buffer-renderer
  renderOpaqueVertexBuffers { reads opaqueVertexBuffer, position, scale?, rotation? }
  renderTransparentVertexBuffers { reads transparentVertexBuffer, position, scale?, rotation? }
