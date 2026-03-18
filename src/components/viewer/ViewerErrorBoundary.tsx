"use client";

import { Component, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface State {
  hasError: boolean;
}

export class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-black text-default-400">
          <span className="text-sm">The viewer encountered an error.</span>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 rounded-md bg-default-100 px-3 py-1.5 text-xs hover:bg-default-200"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
