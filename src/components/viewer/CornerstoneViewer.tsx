"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import type { StudySummary } from "@/lib/types";

// Cornerstone imports - browser-only
import { RenderingEngine, Enums, type Types, init as coreInit } from "@cornerstonejs/core";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  init as toolsInit,
  ToolGroupManager,
  WindowLevelTool,
  StackScrollTool,
  PanTool,
  ZoomTool,
  Enums as ToolEnums,
  addTool,
} from "@cornerstonejs/tools";

let cornerstoneInitialized = false;

async function initCornerstone() {
  if (cornerstoneInitialized) return;
  await coreInit();
  await dicomImageLoaderInit({ maxWebWorkers: navigator.hardwareConcurrency || 2 });
  await toolsInit();

  addTool(WindowLevelTool);
  addTool(StackScrollTool);
  addTool(PanTool);
  addTool(ZoomTool);

  cornerstoneInitialized = true;
}

interface Props {
  study: StudySummary;
  courseSlug: string;
  caseId: string;
}

export default function CornerstoneViewer({ study, courseSlug, caseId }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const renderingEngineRef = useRef<RenderingEngine | null>(null);
  const listenerRef = useRef<EventListener | null>(null);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(study.series[0]?.sliceCount || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unique IDs per instance to avoid collisions
  const instanceId = useId();
  const viewportId = `vp-${instanceId}`;
  const renderingEngineId = `re-${instanceId}`;
  const toolGroupId = `tg-${instanceId}`;

  const loadSeries = useCallback(
    async (idx: number) => {
      if (!elementRef.current) return;
      setLoading(true);
      setError(null);

      try {
        await initCornerstone();

        // Fetch instance URLs from API
        const resp = await fetch(`/api/series/${courseSlug}/${caseId}/${idx}`);
        if (!resp.ok) throw new Error(`Failed to load series: ${resp.status}`);
        const { urls, window: windowPreset } = await resp.json();

        const imageIds = urls.map((url: string) => {
          const proxyUrl = `/api/dicom/${encodeURIComponent(url)}`;
          return `wadouri:${window.location.origin}${proxyUrl}`;
        });

        setTotalSlices(imageIds.length);
        setCurrentSlice(0);

        if (!imageIds.length) {
          setLoading(false);
          return;
        }

        // Clean up previous event listener
        if (listenerRef.current && elementRef.current) {
          elementRef.current.removeEventListener(
            Enums.Events.STACK_NEW_IMAGE,
            listenerRef.current
          );
          listenerRef.current = null;
        }

        // Clean up previous rendering engine
        if (renderingEngineRef.current) {
          renderingEngineRef.current.destroy();
        }

        const renderingEngine = new RenderingEngine(renderingEngineId);
        renderingEngineRef.current = renderingEngine;

        renderingEngine.enableElement({
          viewportId,
          element: elementRef.current,
          type: Enums.ViewportType.STACK,
        });

        // Tool group
        let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
        if (toolGroup) ToolGroupManager.destroyToolGroup(toolGroupId);
        toolGroup = ToolGroupManager.createToolGroup(toolGroupId)!;
        toolGroup.addViewport(viewportId, renderingEngineId);

        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(StackScrollTool.toolName);
        toolGroup.addTool(PanTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);

        toolGroup.setToolActive(StackScrollTool.toolName, {
          bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }],
        });
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
        });
        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
        });
        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }],
        });

        const viewport = renderingEngine.getViewport(viewportId) as Types.IStackViewport;
        await viewport.setStack(imageIds, 0);

        if (windowPreset) {
          viewport.setProperties({
            voiRange: {
              lower: windowPreset.wc - windowPreset.ww / 2,
              upper: windowPreset.wc + windowPreset.ww / 2,
            },
          });
        }

        viewport.render();

        // Track slice changes — store ref for cleanup
        const listener = ((evt: Types.EventTypes.StackNewImageEvent) => {
          setCurrentSlice(evt.detail.imageIdIndex);
        }) as EventListener;

        listenerRef.current = listener;
        elementRef.current.addEventListener(Enums.Events.STACK_NEW_IMAGE, listener);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load viewer");
      } finally {
        setLoading(false);
      }
    },
    [courseSlug, caseId, viewportId, renderingEngineId, toolGroupId]
  );

  useEffect(() => {
    loadSeries(seriesIdx);
    return () => {
      // Clean up event listener
      if (listenerRef.current && elementRef.current) {
        elementRef.current.removeEventListener(
          Enums.Events.STACK_NEW_IMAGE,
          listenerRef.current
        );
        listenerRef.current = null;
      }
      // Clean up tool group
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (toolGroup) ToolGroupManager.destroyToolGroup(toolGroupId);
      // Clean up rendering engine
      if (renderingEngineRef.current) {
        renderingEngineRef.current.destroy();
        renderingEngineRef.current = null;
      }
    };
  }, [seriesIdx, loadSeries, toolGroupId]);

  if (!study.series.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No imaging data available
      </div>
    );
  }

  const activeSeries = study.series[seriesIdx];

  return (
    <div className="flex h-full flex-col">
      {/* Series tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border bg-surface p-1">
        {study.series.map((s, i) => (
          <button
            key={i}
            onClick={() => setSeriesIdx(i)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors ${
              i === seriesIdx
                ? "bg-accent text-black font-medium"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {s.label || `Series ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Viewport */}
      <div className="relative flex-1 bg-black">
        <div
          ref={elementRef}
          className="h-full w-full"
          onContextMenu={(e) => e.preventDefault()}
        />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span className="text-sm text-muted">Loading DICOM...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <span className="text-sm text-danger">{error}</span>
          </div>
        )}

        {/* 4-corner overlay */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top-left: study/series description */}
          <div className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
            {study.description || activeSeries?.label || ""}
          </div>

          {/* Top-right: modality */}
          <div className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
            {activeSeries?.modality || ""}
          </div>

          {/* Bottom-left: controls hint */}
          <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white/50">
            Scroll: slices | Drag: W/L | Middle: pan | Right: zoom
          </div>

          {/* Bottom-right: slice counter */}
          <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
            {currentSlice + 1} / {totalSlices}
          </div>
        </div>
      </div>
    </div>
  );
}
