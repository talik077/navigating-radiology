import { init as coreInit } from "@cornerstonejs/core";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  init as toolsInit,
  addTool,
  WindowLevelTool,
  StackScrollTool,
  PanTool,
  ZoomTool,
  ArrowAnnotateTool,
  LengthTool,
  EllipticalROITool,
} from "@cornerstonejs/tools";
let initialized = false;

export async function initCornerstone() {
  if (initialized) return;
  await coreInit();
  await dicomImageLoaderInit({
    maxWebWorkers: navigator.hardwareConcurrency || 2,
  });
  await toolsInit();

  addTool(WindowLevelTool);
  addTool(StackScrollTool);
  addTool(PanTool);
  addTool(ZoomTool);
  addTool(ArrowAnnotateTool);
  addTool(LengthTool);
  addTool(EllipticalROITool);

  initialized = true;
}

export {
  WindowLevelTool,
  StackScrollTool,
  PanTool,
  ZoomTool,
  ArrowAnnotateTool,
  LengthTool,
  EllipticalROITool,
};
