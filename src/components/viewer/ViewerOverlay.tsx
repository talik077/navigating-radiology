interface Props {
  studyDescription: string;
  seriesLabel: string;
  modality: string;
  wwwl: { ww: number; wc: number } | null;
  currentSlice: number;
  totalSlices: number;
}

export default function ViewerOverlay({
  studyDescription,
  seriesLabel,
  modality,
  wwwl,
  currentSlice,
  totalSlices,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Top-left: study description */}
      <div className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
        {studyDescription}
      </div>

      {/* Top-right: modality + WW/WL */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
        <div className="rounded bg-black/60 px-2 py-1 text-xs text-white/80">
          {modality}
        </div>
        {wwwl && (
          <div className="rounded bg-black/60 px-2 py-1 text-xs text-white/60">
            WW: {wwwl.ww} WC: {wwwl.wc}
          </div>
        )}
      </div>

      {/* Bottom-left: series label */}
      <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white/50">
        {seriesLabel}
      </div>

      {/* Bottom-right: slice counter */}
      <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {currentSlice + 1} / {totalSlices}
      </div>
    </div>
  );
}
