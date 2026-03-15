"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import {
  Layers,
  Move,
  ZoomIn,
  Sun,
  RotateCcw,
  Maximize,
} from "lucide-react";
import type { StudySummary } from "@/lib/types";
import { useViewer, type NavigateParams } from "./ViewerContext";

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

type ActiveTool = "scroll" | "wl" | "pan" | "zoom";

interface Props {
  study: StudySummary;
  courseSlug: string;
  caseId: string;
}

export default function CornerstoneViewer({ study, courseSlug, caseId }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderingEngineRef = useRef<RenderingEngine | null>(null);
  const toolGroupRef = useRef<ReturnType<typeof ToolGroupManager.getToolGroup>>(null);
  const listenerRef = useRef<EventListener | null>(null);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(study.series[0]?.sliceCount || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>("wl");
  const [wwwl, setWwwl] = useState<{ ww: number; wc: number } | null>(null);
  const viewerCtx = useViewer();

  // Unique IDs per instance to avoid collisions
  const instanceId = useId();
  const viewportId = `vp-${instanceId}`;
  const renderingEngineId = `re-${instanceId}`;
  const toolGroupId = `tg-${instanceId}`;

  const switchTool = useCallback(
    (tool: ActiveTool) => {
      const toolGroup = toolGroupRef.current;
      if (!toolGroup) return;

      // Set all tools passive first
      const toolMap: Record<ActiveTool, string> = {
        scroll: StackScrollTool.toolName,
        wl: WindowLevelTool.toolName,
        pan: PanTool.toolName,
        zoom: ZoomTool.toolName,
      };

      for (const [, name] of Object.entries(toolMap)) {
        toolGroup.setToolPassive(name);
      }

      // Set the selected tool as primary click
      toolGroup.setToolActive(toolMap[tool], {
        bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
      });

      // Always keep scroll on wheel
      toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }],
      });

      setActiveTool(tool);
    },
    []
  );

  const resetViewport = useCallback(() => {
    const engine = renderingEngineRef.current;
    if (!engine) return;
    const viewport = engine.getViewport(viewportId) as Types.IStackViewport;
    if (!viewport) return;
    viewport.resetCamera();
    viewport.resetProperties();
    viewport.render();
  }, [viewportId]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  // Handle navigation from teaching links
  const handleNavigate = useCallback(
    (params: NavigateParams) => {
      // Resolve series UID to index
      let targetSeriesIdx = seriesIdx;
      const sParam = params.seriesUID;

      // Try matching by seriesUID
      const uidMatch = study.series.findIndex((s) => s.seriesUID === sParam);
      if (uidMatch >= 0) {
        targetSeriesIdx = uidMatch;
      } else if (/^\d+$/.test(sParam)) {
        // Plain numeric index
        targetSeriesIdx = parseInt(sParam, 10);
      } else {
        // Might be a MongoDB ObjectId — match against end of seriesUID
        const objIdMatch = study.series.findIndex(
          (s) => s.seriesUID.endsWith(sParam) || s.seriesUID.includes(sParam)
        );
        if (objIdMatch >= 0) targetSeriesIdx = objIdMatch;
      }

      // Clamp to valid range
      targetSeriesIdx = Math.max(0, Math.min(targetSeriesIdx, study.series.length - 1));

      // Resolve instance index
      let sliceIndex = 0;
      if (typeof params.instanceIndex === "number") {
        sliceIndex = params.instanceIndex;
      } else if (/^\d+$/.test(params.instanceIndex)) {
        sliceIndex = parseInt(params.instanceIndex, 10);
      }
      // For non-numeric instance IDs (MongoDB ObjectIds), we'd need instance-level data
      // which we don't have on the client — fall back to index 0

      // If we need to switch series, update state (triggers loadSeries via useEffect)
      if (targetSeriesIdx !== seriesIdx) {
        setSeriesIdx(targetSeriesIdx);
        // We can't navigate to the slice yet — it'll happen after loadSeries completes
        // Store pending navigation in a ref
        pendingNavRef.current = { sliceIndex, ww: params.ww, wc: params.wc };
        return;
      }

      // Same series — navigate directly
      const engine = renderingEngineRef.current;
      if (!engine) return;
      const viewport = engine.getViewport(viewportId) as Types.IStackViewport;
      if (!viewport) return;

      viewport.setImageIdIndex(sliceIndex);
      viewport.setProperties({
        voiRange: {
          lower: params.wc - params.ww / 2,
          upper: params.wc + params.ww / 2,
        },
      });
      setWwwl({ ww: params.ww, wc: params.wc });
      viewport.render();
    },
    [seriesIdx, study.series, viewportId]
  );

  // Ref for pending navigation after series switch
  const pendingNavRef = useRef<{ sliceIndex: number; ww: number; wc: number } | null>(null);

  // Register navigation handler with ViewerContext
  useEffect(() => {
    if (!viewerCtx) return;
    viewerCtx.registerHandler(handleNavigate);
    return () => viewerCtx.unregisterHandler();
  }, [viewerCtx, handleNavigate]);

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
        toolGroupRef.current = toolGroup;
        toolGroup.addViewport(viewportId, renderingEngineId);

        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(StackScrollTool.toolName);
        toolGroup.addTool(PanTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);

        // Default: scroll on wheel, W/L on left click
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

        setActiveTool("wl");

        const viewport = renderingEngine.getViewport(viewportId) as Types.IStackViewport;
        await viewport.setStack(imageIds, 0);

        if (windowPreset) {
          viewport.setProperties({
            voiRange: {
              lower: windowPreset.wc - windowPreset.ww / 2,
              upper: windowPreset.wc + windowPreset.ww / 2,
            },
          });
          setWwwl({ ww: windowPreset.ww, wc: windowPreset.wc });
        }

        viewport.render();

        // Apply pending navigation (from teaching link that triggered a series switch)
        const pending = pendingNavRef.current;
        if (pending) {
          pendingNavRef.current = null;
          viewport.setImageIdIndex(pending.sliceIndex);
          viewport.setProperties({
            voiRange: {
              lower: pending.wc - pending.ww / 2,
              upper: pending.wc + pending.ww / 2,
            },
          });
          setWwwl({ ww: pending.ww, wc: pending.wc });
          viewport.render();
        }

        // Track slice changes
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
      toolGroupRef.current = null;
      // Clean up rendering engine
      if (renderingEngineRef.current) {
        renderingEngineRef.current.destroy();
        renderingEngineRef.current = null;
      }
    };
  }, [seriesIdx, loadSeries, toolGroupId]);

  if (!study.series.length) {
    return (
      <div className="flex h-full items-center justify-center text-default-400">
        No imaging data available
      </div>
    );
  }

  const activeSeries = study.series[seriesIdx];

  const toolButtons: { id: ActiveTool; icon: React.ReactNode; label: string }[] = [
    { id: "wl", icon: <Sun size={16} />, label: "W/L" },
    { id: "scroll", icon: <Layers size={16} />, label: "Scroll" },
    { id: "pan", icon: <Move size={16} />, label: "Pan" },
    { id: "zoom", icon: <ZoomIn size={16} />, label: "Zoom" },
  ];

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-default-200 bg-content1 px-2 py-1">
        {toolButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => switchTool(btn.id)}
            title={btn.label}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              activeTool === btn.id
                ? "bg-primary/20 text-primary font-medium"
                : "text-default-400 hover:bg-default-100 hover:text-default-600"
            }`}
          >
            {btn.icon}
            <span className="hidden sm:inline">{btn.label}</span>
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-default-200" />

        <button
          onClick={resetViewport}
          title="Reset"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-default-400 hover:bg-default-100 hover:text-default-600 transition-colors"
        >
          <RotateCcw size={16} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={toggleFullscreen}
          title="Fullscreen"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-default-400 hover:bg-default-100 hover:text-default-600 transition-colors"
        >
          <Maximize size={16} />
          <span className="hidden sm:inline">Fullscreen</span>
        </button>

        {/* Series selector */}
        {study.series.length > 1 && (
          <>
            <div className="mx-1 h-4 w-px bg-default-200" />
            <select
              value={seriesIdx}
              onChange={(e) => setSeriesIdx(Number(e.target.value))}
              className="max-w-[200px] truncate rounded-md bg-default-100 px-2 py-1.5 text-xs text-default-400 outline-none hover:bg-default-200"
            >
              {study.series.map((s, i) => (
                <option key={i} value={i}>
                  {s.label || `Series ${i + 1}`}
                </option>
              ))}
            </select>
          </>
        )}
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-default-400">Loading DICOM...</span>
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

          {/* Top-right: modality + WW/WL */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
            <div className="rounded bg-black/60 px-2 py-1 text-xs text-white/80">
              {activeSeries?.modality || ""}
            </div>
            {wwwl && (
              <div className="rounded bg-black/60 px-2 py-1 text-xs text-white/60">
                WW: {wwwl.ww} WC: {wwwl.wc}
              </div>
            )}
          </div>

          {/* Bottom-left: series label */}
          <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white/50">
            {activeSeries?.label || ""}
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
