"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import { RenderingEngine, Enums, type Types, utilities as coreUtilities } from "@cornerstonejs/core";
import {
  ToolGroupManager,
  annotation as csAnnotation,
  Enums as ToolEnums,
} from "@cornerstonejs/tools";

import type { StudySummary } from "@/lib/types";
import { useViewer, type NavigateParams } from "./ViewerContext";
import { initCornerstone, WindowLevelTool, StackScrollTool, PanTool, ZoomTool, ArrowAnnotateTool, LengthTool, EllipticalROITool } from "./cornerstoneInit";
import { applyAnnotations, clearAnnotations, ANNOTATION_STYLES, type SliceAnnotation } from "./annotations";
import ViewerToolbar, { type ActiveTool } from "./ViewerToolbar";
import ViewerOverlay from "./ViewerOverlay";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_MAP: Record<ActiveTool, string> = {
  scroll: StackScrollTool.toolName,
  wl: WindowLevelTool.toolName,
  pan: PanTool.toolName,
  zoom: ZoomTool.toolName,
};

const WHEEL_THRESHOLD = 40; // deltaY pixels per image change (trackpad smoothing)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  study: StudySummary;
  courseSlug: string;
  caseId: string;
}

export default function CornerstoneViewer({ study, courseSlug, caseId }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  const toolGroupRef = useRef<ReturnType<typeof ToolGroupManager.getToolGroup>>(null);
  const listenerRef = useRef<EventListener | null>(null);
  const wheelRef = useRef<((e: WheelEvent) => void) | null>(null);
  const annotationsRef = useRef<SliceAnnotation[]>([]);
  const pendingNavRef = useRef<{
    sliceIndex: number;
    ww: number;
    wc: number;
    showAnnotations?: boolean;
  } | null>(null);
  const pendingAnnotationRef = useRef<{
    sliceIndex: number;
    show: boolean;
  } | null>(null);

  const [seriesIdx, setSeriesIdx] = useState(0);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(study.series[0]?.sliceCount || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>("wl");
  const [wwwl, setWwwl] = useState<{ ww: number; wc: number } | null>(null);

  const viewerCtx = useViewer();
  const instanceId = useId();
  const viewportId = `vp-${instanceId}`;
  const engineId = `re-${instanceId}`;
  const toolGroupId = `tg-${instanceId}`;

  // -----------------------------------------------------------------------
  // Toolbar actions
  // -----------------------------------------------------------------------

  const switchTool = useCallback((tool: ActiveTool) => {
    const tg = toolGroupRef.current;
    if (!tg) return;
    for (const name of Object.values(TOOL_MAP)) tg.setToolPassive(name);
    tg.setToolActive(TOOL_MAP[tool], {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
    });
    setActiveTool(tool);
  }, []);

  const resetViewport = useCallback(() => {
    const vp = engineRef.current?.getViewport(viewportId) as Types.IStackViewport | undefined;
    if (!vp) return;
    vp.resetCamera();
    vp.resetProperties();
    vp.render();
  }, [viewportId]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  }, []);

  // -----------------------------------------------------------------------
  // Teaching-link navigation (ref-based — stable registration)
  // -----------------------------------------------------------------------

  const handleNavigateRef = useRef<((params: NavigateParams) => void) | null>(null);

  handleNavigateRef.current = (params: NavigateParams) => {
    // Resolve series UID → index
    let targetIdx = seriesIdx;
    const sParam = params.seriesUID;
    const uidMatch = study.series.findIndex((s) => s.seriesUID === sParam);
    if (uidMatch >= 0) {
      targetIdx = uidMatch;
    } else if (/^\d+$/.test(sParam)) {
      targetIdx = parseInt(sParam, 10);
    } else {
      const partial = study.series.findIndex((s) => s.seriesUID.endsWith(sParam) || s.seriesUID.includes(sParam));
      if (partial >= 0) targetIdx = partial;
    }
    targetIdx = Math.max(0, Math.min(targetIdx, study.series.length - 1));

    // Teaching links use 1-based `i` param → convert to 0-based
    const sliceIndex = Math.max(0, params.instanceIndex - 1);

    // Series switch → defer navigation to loadSeries
    if (targetIdx !== seriesIdx) {
      setSeriesIdx(targetIdx);
      pendingNavRef.current = { sliceIndex, ww: params.ww, wc: params.wc, showAnnotations: params.annotations };
      return;
    }

    // Same series → navigate directly
    const vp = engineRef.current?.getViewport(viewportId) as Types.IStackViewport | undefined;
    if (!vp) return;

    vp.setProperties({
      voiRange: { lower: params.wc - params.ww / 2, upper: params.wc + params.ww / 2 },
    });
    setWwwl({ ww: params.ww, wc: params.wc });

    // Defer annotation application to STACK_NEW_IMAGE event (metadata needs to be loaded)
    pendingAnnotationRef.current = { sliceIndex, show: params.annotations };
    vp.setImageIdIndex(sliceIndex);
  };

  useEffect(() => {
    if (!viewerCtx) return;
    viewerCtx.registerHandler((p) => handleNavigateRef.current?.(p));
    return () => viewerCtx.unregisterHandler();
  }, [viewerCtx]);

  // -----------------------------------------------------------------------
  // Series loading
  // -----------------------------------------------------------------------

  const loadSeries = useCallback(
    async (idx: number, signal: AbortSignal) => {
      if (!elementRef.current) return;
      setLoading(true);
      setError(null);
      clearAnnotations();

      try {
        await initCornerstone();
        if (signal.aborted) return;

        const resp = await fetch(`/api/series/${courseSlug}/${caseId}/${idx}`);
        if (signal.aborted) return;
        if (!resp.ok) throw new Error(`Failed to load series: ${resp.status}`);
        const { urls, window: windowPreset, annotations: annData } = await resp.json();
        if (signal.aborted) return;
        annotationsRef.current = annData ?? [];

        const imageIds = urls.map((url: string) => {
          const proxyUrl = `/api/dicom/${encodeURIComponent(url)}`;
          return `wadouri:${window.location.origin}${proxyUrl}`;
        });

        setTotalSlices(imageIds.length);
        setCurrentSlice(0);
        if (!imageIds.length) { setLoading(false); return; }

        // --- Cleanup previous resources ---
        if (listenerRef.current && elementRef.current) {
          elementRef.current.removeEventListener(Enums.Events.STACK_NEW_IMAGE, listenerRef.current);
          listenerRef.current = null;
        }
        if (wheelRef.current && elementRef.current) {
          elementRef.current.removeEventListener("wheel", wheelRef.current as EventListener);
          wheelRef.current = null;
        }
        if (engineRef.current) engineRef.current.destroy();

        if (signal.aborted) return;

        // --- Create rendering engine & viewport ---
        const engine = new RenderingEngine(engineId);
        engineRef.current = engine;
        engine.enableElement({ viewportId, element: elementRef.current, type: Enums.ViewportType.STACK });

        // --- Tool group ---
        let tg = ToolGroupManager.getToolGroup(toolGroupId);
        if (tg) ToolGroupManager.destroyToolGroup(toolGroupId);
        tg = ToolGroupManager.createToolGroup(toolGroupId)!;
        toolGroupRef.current = tg;
        tg.addViewport(viewportId, engineId);

        tg.addTool(WindowLevelTool.toolName);
        tg.addTool(StackScrollTool.toolName);
        tg.addTool(PanTool.toolName);
        tg.addTool(ZoomTool.toolName);
        tg.addTool(ArrowAnnotateTool.toolName);
        tg.addTool(LengthTool.toolName);
        tg.addTool(EllipticalROITool.toolName);

        // Annotation tools: passive (hover highlight works, unlocked so hover detection fires)
        tg.setToolPassive(ArrowAnnotateTool.toolName);
        tg.setToolPassive(LengthTool.toolName);
        tg.setToolPassive(EllipticalROITool.toolName);

        // Apply annotation styles to this tool group
        csAnnotation.config.style.setToolGroupToolStyles(toolGroupId, ANNOTATION_STYLES);

        // Interaction tools
        tg.setToolActive(WindowLevelTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }] });
        tg.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }] });
        tg.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] });
        // Note: StackScrollTool NOT bound to wheel — custom handler below for trackpad smoothing
        setActiveTool("wl");

        // --- Load stack ---
        const vp = engine.getViewport(viewportId) as Types.IStackViewport;
        await vp.setStack(imageIds, 0);
        if (signal.aborted) return;

        engine.resize(true, false);

        if (windowPreset) {
          vp.setProperties({
            voiRange: { lower: windowPreset.wc - windowPreset.ww / 2, upper: windowPreset.wc + windowPreset.ww / 2 },
          });
          setWwwl({ ww: windowPreset.ww, wc: windowPreset.wc });
        }

        vp.render();

        // --- Apply pending navigation (series switch from teaching link) ---
        const pending = pendingNavRef.current;
        if (pending) {
          pendingNavRef.current = null;
          vp.setProperties({
            voiRange: { lower: pending.wc - pending.ww / 2, upper: pending.wc + pending.ww / 2 },
          });
          setWwwl({ ww: pending.ww, wc: pending.wc });
          // Defer annotation to STACK_NEW_IMAGE
          if (pending.showAnnotations) {
            pendingAnnotationRef.current = { sliceIndex: pending.sliceIndex, show: true };
          }
          vp.setImageIdIndex(pending.sliceIndex);
        }

        // --- STACK_NEW_IMAGE listener (slice tracking + deferred annotation) ---
        const onNewImage = ((evt: Types.EventTypes.StackNewImageEvent) => {
          const idx = evt.detail.imageIdIndex;
          setCurrentSlice(idx);

          // Apply deferred annotations (metadata now available)
          const pa = pendingAnnotationRef.current;
          if (pa && idx === pa.sliceIndex) {
            pendingAnnotationRef.current = null;
            applyAnnotations(vp, viewportId, elementRef.current!, annotationsRef.current, pa.sliceIndex, pa.show);
          }
        }) as EventListener;
        listenerRef.current = onNewImage;
        elementRef.current.addEventListener(Enums.Events.STACK_NEW_IMAGE, onNewImage);

        // --- Custom wheel handler (trackpad smoothing) ---
        let wheelAccum = 0;
        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          wheelAccum += e.deltaY;
          const steps = Math.trunc(wheelAccum / WHEEL_THRESHOLD);
          if (steps !== 0) {
            wheelAccum -= steps * WHEEL_THRESHOLD;
            coreUtilities.scroll(vp, { delta: steps });
          }
        };
        wheelRef.current = onWheel;
        elementRef.current.addEventListener("wheel", onWheel as EventListener, { passive: false });
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load viewer");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [courseSlug, caseId, viewportId, engineId, toolGroupId],
  );

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  useEffect(() => {
    const ac = new AbortController();
    loadSeries(seriesIdx, ac.signal);

    return () => {
      ac.abort();
      clearAnnotations();

      if (listenerRef.current && elementRef.current) {
        elementRef.current.removeEventListener(Enums.Events.STACK_NEW_IMAGE, listenerRef.current);
        listenerRef.current = null;
      }
      if (wheelRef.current && elementRef.current) {
        elementRef.current.removeEventListener("wheel", wheelRef.current as EventListener);
        wheelRef.current = null;
      }

      const tg = ToolGroupManager.getToolGroup(toolGroupId);
      if (tg) ToolGroupManager.destroyToolGroup(toolGroupId);
      toolGroupRef.current = null;

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [seriesIdx, loadSeries, toolGroupId]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (!study.series.length) {
    return (
      <div className="flex h-full items-center justify-center text-default-400">
        No imaging data available
      </div>
    );
  }

  const activeSeries = study.series[seriesIdx];

  return (
    <div ref={containerRef} className="flex h-full flex-col">
      <ViewerToolbar
        activeTool={activeTool}
        onSwitchTool={switchTool}
        onReset={resetViewport}
        onFullscreen={toggleFullscreen}
        series={study.series}
        seriesIdx={seriesIdx}
        onSeriesChange={setSeriesIdx}
      />

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

        <ViewerOverlay
          studyDescription={study.description || activeSeries?.label || ""}
          seriesLabel={activeSeries?.label || ""}
          modality={activeSeries?.modality || ""}
          wwwl={wwwl}
          currentSlice={currentSlice}
          totalSlices={totalSlices}
        />
      </div>
    </div>
  );
}
