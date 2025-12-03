import { applyArg } from '@adobe/data/functions';
import { VoxelEditorCoreService } from '../voxel-editor-service.js';
import * as actions from './index.js';

export const createActionsService = (service: VoxelEditorCoreService) => applyArg(service, actions);

