"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  Pen, 
  Square, 
  Circle, 
  Type, 
  Eraser 
} from "lucide-react";

interface CanvasBoardProps {
  boardId: string;
}

type ToolType = "select" | "pen" | "rectangle" | "circle" | "text" | "eraser";

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

interface Shape {
  id: string;
  type: "rectangle" | "circle";
  startPoint: Point;
  endPoint: Point;
  color: string;
  width: number;
  fillColor?: string;
}

export function CanvasBoard({ boardId }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentShape, setCurrentShape] = useState<Partial<Shape> | null>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState("transparent");
  
  const [viewport, setViewport] = useState({
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });

  const colors = [
    "#000000", "#ff0000", "#00ff00", "#0000ff", 
    "#ffff00", "#ff00ff", "#00ffff", "#ffa500"
  ];

  const tools = [
    { type: "select" as ToolType, icon: MousePointer2, label: "Select" },
    { type: "pen" as ToolType, icon: Pen, label: "Pen" },
    { type: "rectangle" as ToolType, icon: Square, label: "Rectangle" },
    { type: "circle" as ToolType, icon: Circle, label: "Circle" },
    { type: "text" as ToolType, icon: Type, label: "Text" },
    { type: "eraser" as ToolType, icon: Eraser, label: "Eraser" },
  ];

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);

    // Draw grid
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    const startX = Math.floor(-viewport.offsetX / viewport.scale / gridSize) * gridSize;
    const startY = Math.floor(-viewport.offsetY / viewport.scale / gridSize) * gridSize;
    const endX = startX + (canvas.width / viewport.scale) + gridSize;
    const endY = startY + (canvas.height / viewport.scale) + gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw paths
    paths.forEach((path) => {
      if (path.points.length > 1) {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      }
    });

    // Draw shapes
    shapes.forEach((shape) => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.width;
      
      if (shape.fillColor && shape.fillColor !== "transparent") {
        ctx.fillStyle = shape.fillColor;
      }

      if (shape.type === "rectangle") {
        const width = shape.endPoint.x - shape.startPoint.x;
        const height = shape.endPoint.y - shape.startPoint.y;
        
        ctx.beginPath();
        ctx.rect(shape.startPoint.x, shape.startPoint.y, width, height);
        
        if (shape.fillColor && shape.fillColor !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
      } else if (shape.type === "circle") {
        const centerX = (shape.startPoint.x + shape.endPoint.x) / 2;
        const centerY = (shape.startPoint.y + shape.endPoint.y) / 2;
        const radiusX = Math.abs(shape.endPoint.x - shape.startPoint.x) / 2;
        const radiusY = Math.abs(shape.endPoint.y - shape.startPoint.y) / 2;
        const radius = Math.min(radiusX, radiusY);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        
        if (shape.fillColor && shape.fillColor !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
      }
    });

    // Draw current path
    if (isDrawing && currentPath.length > 1) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }

    // Draw current shape preview
    if (isDrawing && currentShape && currentShape.startPoint && currentShape.endPoint) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.setLineDash([5, 5]); // Dashed preview

      if (fillColor && fillColor !== "transparent") {
        ctx.fillStyle = fillColor;
      }

      if (currentShape.type === "rectangle") {
        const width = currentShape.endPoint.x - currentShape.startPoint.x;
        const height = currentShape.endPoint.y - currentShape.startPoint.y;
        
        ctx.beginPath();
        ctx.rect(currentShape.startPoint.x, currentShape.startPoint.y, width, height);
        
        if (fillColor && fillColor !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
      } else if (currentShape.type === "circle") {
        const centerX = (currentShape.startPoint.x + currentShape.endPoint.x) / 2;
        const centerY = (currentShape.startPoint.y + currentShape.endPoint.y) / 2;
        const radiusX = Math.abs(currentShape.endPoint.x - currentShape.startPoint.x) / 2;
        const radiusY = Math.abs(currentShape.endPoint.y - currentShape.startPoint.y) / 2;
        const radius = Math.min(radiusX, radiusY);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        
        if (fillColor && fillColor !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
      }

      ctx.setLineDash([]); // Reset dash
    }

    ctx.restore();
  }, [paths, currentPath, isDrawing, strokeColor, strokeWidth, viewport]);

  const screenToCanvas = useCallback((screenPoint: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return screenPoint;

    const rect = canvas.getBoundingClientRect();
    const x = (screenPoint.x - rect.left - viewport.offsetX) / viewport.scale;
    const y = (screenPoint.y - rect.top - viewport.offsetY) / viewport.scale;
    
    return { x, y };
  }, [viewport]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPoint = screenToCanvas(screenPoint);

    setIsDrawing(true);

    if (currentTool === "pen") {
      setCurrentPath([canvasPoint]);
    } else if (currentTool === "rectangle" || currentTool === "circle") {
      setCurrentShape({
        type: currentTool,
        startPoint: canvasPoint,
        endPoint: canvasPoint,
      });
    }
  }, [currentTool, screenToCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPoint = screenToCanvas(screenPoint);

    if (isDrawing && currentTool === "pen") {
      setCurrentPath(prev => [...prev, canvasPoint]);
    }
  }, [isDrawing, currentTool, screenToCanvas]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentTool === "pen" && currentPath.length > 1) {
      const newPath: DrawingPath = {
        id: crypto.randomUUID(),
        points: [...currentPath],
        color: strokeColor,
        width: strokeWidth
      };
      setPaths(prev => [...prev, newPath]);
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentTool, currentPath, strokeColor, strokeWidth]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * scaleFactor));
    
    setViewport(prev => ({ ...prev, scale: newScale }));
  }, [viewport.scale]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="h-screen w-full bg-gray-50 relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 bg-white border rounded-lg shadow-lg p-2">
        <div className="flex flex-col gap-2">
          {/* Tools */}
          <div className="flex gap-1">
            {tools.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant={currentTool === type ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool(type)}
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
                className={`w-6 h-6 rounded border-2 hover:border-gray-500 ${
                  strokeColor === color ? "border-blue-500" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setStrokeColor(color)}
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
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 h-2"
            />
            <span className="text-xs w-6">{strokeWidth}</span>
          </div>

          {/* Clear Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaths([])}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="cursor-crosshair bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {/* Board Info */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow text-sm">
        <h3 className="font-medium mb-1">Board: {boardId}</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Select pen tool and draw</li>
          <li>• Mouse wheel to zoom</li>
          <li>• Change colors and width</li>
          <li>• Paths: {paths.length}</li>
        </ul>
      </div>
    </div>
  );
}