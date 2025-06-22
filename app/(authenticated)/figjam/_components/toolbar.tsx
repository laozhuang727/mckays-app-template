"use client";

import { Button } from "@/components/ui/button";
import { useDrawing, ToolType } from "../_contexts/drawing-context";
import { 
  MousePointer2, 
  Pen, 
  Square, 
  Circle, 
  Type, 
  Eraser,
  Palette
} from "lucide-react";

const tools: Array<{ type: ToolType; icon: React.ComponentType<{ className?: string }>; label: string }> = [
  { type: "select", icon: MousePointer2, label: "Select" },
  { type: "pen", icon: Pen, label: "Pen" },
  { type: "rectangle", icon: Square, label: "Rectangle" },
  { type: "circle", icon: Circle, label: "Circle" },
  { type: "text", icon: Type, label: "Text" },
  { type: "eraser", icon: Eraser, label: "Eraser" },
];

const colors = [
  "#000000", "#ff0000", "#00ff00", "#0000ff", 
  "#ffff00", "#ff00ff", "#00ffff", "#ffa500"
];

export function Toolbar() {
  const { state, dispatch } = useDrawing();

  return (
    <div className="absolute top-4 left-4 z-10 bg-white border rounded-lg shadow-lg p-2">
      <div className="flex flex-col gap-2">
        {/* Tools */}
        <div className="flex gap-1">
          {tools.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant={state.currentTool === type ? "default" : "outline"}
              size="sm"
              onClick={() => dispatch({ type: "SET_TOOL", payload: type })}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {colors.map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
              style={{ backgroundColor: color }}
              onClick={() => dispatch({ 
                type: "SET_STYLE", 
                payload: { strokeColor: color } 
              })}
              title={`Color: ${color}`}
            />
          ))}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Width:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={state.style.strokeWidth}
            onChange={(e) => dispatch({
              type: "SET_STYLE",
              payload: { strokeWidth: Number(e.target.value) }
            })}
            className="w-16 h-2"
          />
          <span className="text-xs w-6">{state.style.strokeWidth}</span>
        </div>
      </div>
    </div>
  );
}