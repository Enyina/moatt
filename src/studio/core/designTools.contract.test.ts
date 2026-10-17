import {
  createInitialStudioState,
  selectStudioTarget,
  setStudioTool,
} from './studioState';
import {
  DESIGN_TOOLS,
  getAvailableStudioTools,
  getStudioTool,
  isStudioToolAvailable,
} from './designTools';
import type { StudioToolId } from './types';

const expectType = <T>(value: T): void => {
  void value;
};

const studio = createInitialStudioState();
const selectTool = getStudioTool('select');

expectType<StudioToolId>(selectTool.id);
expectType<string>(selectTool.label);
expectType<boolean>(isStudioToolAvailable(selectTool, studio));
expectType<StudioToolId[]>(getAvailableStudioTools(studio).map((tool) => tool.id));

const noSelection = selectStudioTarget(studio, { type: 'none' });
expectType<boolean>(isStudioToolAvailable(getStudioTool('shape'), noSelection));

const withGarment = selectStudioTarget(studio, {
  type: 'garment',
  garmentInstanceId: studio.outfit.activeGarmentInstanceId!,
});
expectType<boolean>(isStudioToolAvailable(getStudioTool('fabric'), withGarment));

const toolChanged = setStudioTool(withGarment, DESIGN_TOOLS.graphic.id);
expectType<StudioToolId>(toolChanged.activeToolId);
