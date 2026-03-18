import { type Types, utilities as csUtilities } from "@cornerstonejs/core";
import {
  annotation as csAnnotation,
  ArrowAnnotateTool,
  LengthTool,
  EllipticalROITool,
} from "@cornerstonejs/tools";

/** Annotation style overrides applied per tool group. */
export const ANNOTATION_STYLES = {
  global: {
    color: "rgb(255, 255, 0)",
    colorHighlighted: "rgb(0, 255, 0)",
    colorSelected: "rgb(0, 220, 0)",
    textBoxBackground: "rgba(0, 0, 0, 0.6)",
    textBoxColor: "rgb(255, 255, 0)",
    textBoxColorHighlighted: "rgb(0, 255, 0)",
  },
};

export interface SliceAnnotation {
  index: number;
  data: {
    arrow?: { data: AnnotationEntry[] };
    arrowAnnotate?: { data: AnnotationEntry[] };
    length?: { data: AnnotationEntry[] };
    ellipticalRoi?: { data: AnnotationEntry[] };
  };
}

interface AnnotationEntry {
  visible?: boolean;
  text?: string;
  handles?: {
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
}

/**
 * Apply all annotation types for a given slice.
 * Must be called AFTER the target image is loaded (metadata cached).
 */
export function applyAnnotations(
  viewport: Types.IStackViewport,
  viewportId: string,
  element: HTMLDivElement,
  annotations: SliceAnnotation[],
  sliceIndex: number,
  show: boolean,
) {
  // Always clear previous annotations
  csAnnotation.state.removeAllAnnotations();

  if (!show) {
    viewport.render();
    return;
  }

  const sliceAnn = annotations.find((a) => a.index === sliceIndex);
  if (!sliceAnn?.data) {
    viewport.render();
    return;
  }

  const imageId = viewport.getImageIds()[sliceIndex];
  if (!imageId) {
    viewport.render();
    return;
  }

  const toWorld = (x: number, y: number): Types.Point3 => {
    return csUtilities.imageToWorldCoords(imageId, [x, y]) as Types.Point3;
  };

  try {
    // Arrow annotations (no text label)
    for (const a of sliceAnn.data.arrow?.data ?? []) {
      if (!a.visible || !a.handles?.start || !a.handles?.end) continue;
      ArrowAnnotateTool.hydrate(
        viewportId,
        [
          toWorld(a.handles.start.x, a.handles.start.y),
          toWorld(a.handles.end.x, a.handles.end.y),
        ],
        "",
      );
    }

    // Arrow annotations with text label
    for (const a of sliceAnn.data.arrowAnnotate?.data ?? []) {
      if (!a.visible || !a.handles?.start || !a.handles?.end) continue;
      ArrowAnnotateTool.hydrate(
        viewportId,
        [
          toWorld(a.handles.start.x, a.handles.start.y),
          toWorld(a.handles.end.x, a.handles.end.y),
        ],
        a.text ?? "",
      );
    }

    // Length measurements
    for (const a of sliceAnn.data.length?.data ?? []) {
      if (!a.visible || !a.handles?.start || !a.handles?.end) continue;
      LengthTool.hydrate(viewportId, [
        toWorld(a.handles.start.x, a.handles.start.y),
        toWorld(a.handles.end.x, a.handles.end.y),
      ]);
    }

    // Elliptical ROI
    for (const a of sliceAnn.data.ellipticalRoi?.data ?? []) {
      if (!a.visible || !a.handles?.start || !a.handles?.end) continue;
      EllipticalROITool.hydrate(viewportId, [
        toWorld(a.handles.start.x, a.handles.start.y),
        toWorld(a.handles.end.x, a.handles.end.y),
      ]);
    }
    // Hydrated annotations start with highlighted=true (Cornerstone default).
    // Set to false so they render with default color; hover will toggle highlight.
    for (const ann of csAnnotation.state.getAllAnnotations()) {
      ann.highlighted = false;
    }
  } catch (err) {
    console.warn("[Annotations] failed to apply:", err);
  }

  viewport.render();
}

/** Clear all annotations and re-render. */
export function clearAnnotations(viewport?: Types.IStackViewport) {
  csAnnotation.state.removeAllAnnotations();
  viewport?.render();
}
