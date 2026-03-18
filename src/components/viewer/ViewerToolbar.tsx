import {
  Layers,
  Move,
  ZoomIn,
  Sun,
  RotateCcw,
  Maximize,
} from "lucide-react";

export type ActiveTool = "scroll" | "wl" | "pan" | "zoom";

const TOOL_BUTTONS: { id: ActiveTool; icon: React.ReactNode; label: string }[] = [
  { id: "wl", icon: <Sun size={16} />, label: "W/L" },
  { id: "scroll", icon: <Layers size={16} />, label: "Scroll" },
  { id: "pan", icon: <Move size={16} />, label: "Pan" },
  { id: "zoom", icon: <ZoomIn size={16} />, label: "Zoom" },
];

interface Props {
  activeTool: ActiveTool;
  onSwitchTool: (tool: ActiveTool) => void;
  onReset: () => void;
  onFullscreen: () => void;
  series: { label?: string }[];
  seriesIdx: number;
  onSeriesChange: (idx: number) => void;
}

export default function ViewerToolbar({
  activeTool,
  onSwitchTool,
  onReset,
  onFullscreen,
  series,
  seriesIdx,
  onSeriesChange,
}: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-default-200 bg-content1 px-2 py-1">
      {TOOL_BUTTONS.map((btn) => (
        <button
          key={btn.id}
          onClick={() => onSwitchTool(btn.id)}
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
        onClick={onReset}
        title="Reset"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-default-400 hover:bg-default-100 hover:text-default-600 transition-colors"
      >
        <RotateCcw size={16} />
        <span className="hidden sm:inline">Reset</span>
      </button>

      <button
        onClick={onFullscreen}
        title="Fullscreen"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-default-400 hover:bg-default-100 hover:text-default-600 transition-colors"
      >
        <Maximize size={16} />
        <span className="hidden sm:inline">Fullscreen</span>
      </button>

      {series.length > 1 && (
        <>
          <div className="mx-1 h-4 w-px bg-default-200" />
          <select
            value={seriesIdx}
            onChange={(e) => onSeriesChange(Number(e.target.value))}
            className="max-w-[200px] truncate rounded-md bg-default-100 px-2 py-1.5 text-xs text-default-400 outline-none hover:bg-default-200"
          >
            {series.map((s, i) => (
              <option key={i} value={i}>
                {s.label || `Series ${i + 1}`}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
