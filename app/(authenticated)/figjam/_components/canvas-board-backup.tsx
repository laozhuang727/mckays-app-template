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
  rotation?: number;
  zIndex?: number;
}

interface Shape {
  id: string;
  type: "rectangle" | "circle";
  startPoint: Point;
  endPoint: Point;
  color: string;
  width: number;
  fillColor?: string;
  rotation?: number;
  zIndex?: number;
}

interface TextElement {
  id: string;
  type: "text";
  position: Point;
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  color: string;
  rotation?: number;
  zIndex?: number;
}

interface DrawableObject {
  id: string;
  type: "path" | "rectangle" | "circle" | "text";
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface CanvasState {
  paths: DrawingPath[];
  shapes: Shape[];
  texts: TextElement[];
}

interface Command {
  execute: () => void;
  undo: () => void;
  description: string;
}

export function CanvasBoard({ boardId }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [texts, setTexts] = useState<TextElement[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentShape, setCurrentShape] = useState<Partial<Shape> | null>(null);
  const [editingText, setEditingText] = useState<{ id: string; position: Point } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState("transparent");
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ point: Point; bounds: any } | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState<{ point: Point; center: Point; initialRotation: number } | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>("default");
  const [clipboard, setClipboard] = useState<(DrawingPath | Shape | TextElement)[]>([]);
  const [history, setHistory] = useState<Command[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [viewport, setViewport] = useState({
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });

  const colors = [
    "#000000", "#ff0000", "#00ff00", "#0000ff", 
    "#ffff00", "#ff00ff", "#00ffff", "#ffa500"
  ];

  // Helper function to execute a command and add it to history
  const executeCommand = useCallback((command: Command) => {
    command.execute();
    
    // Remove any commands after the current index (for branching undo/redo)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(command);
    
    // Limit history size to prevent memory issues
    const MAX_HISTORY = 50;
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Helper function to calculate bounding box for objects
  const getBounds = useCallback((obj: DrawingPath | Shape | TextElement): { x: number; y: number; width: number; height: number } => {
    if ('points' in obj) {
      // Path object
      if (obj.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      
      const xs = obj.points.map(p => p.x);
      const ys = obj.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      return {
        x: minX - obj.width / 2,
        y: minY - obj.width / 2,
        width: maxX - minX + obj.width,
        height: maxY - minY + obj.width
      };
    } else if ('content' in obj) {
      // Text object
      const canvas = canvasRef.current;
      if (!canvas) return { x: obj.position.x, y: obj.position.y, width: 100, height: obj.fontSize };
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return { x: obj.position.x, y: obj.position.y, width: 100, height: obj.fontSize };
      
      ctx.font = `${obj.fontStyle} ${obj.fontWeight} ${obj.fontSize}px ${obj.fontFamily}`;
      const metrics = ctx.measureText(obj.content);
      const width = metrics.width;
      const height = obj.fontSize;
      
      return {
        x: obj.position.x,
        y: obj.position.y - height,
        width,
        height
      };
    } else {
      // Shape object
      const minX = Math.min(obj.startPoint.x, obj.endPoint.x);
      const minY = Math.min(obj.startPoint.y, obj.endPoint.y);
      const width = Math.abs(obj.endPoint.x - obj.startPoint.x);
      const height = Math.abs(obj.endPoint.y - obj.startPoint.y);
      
      return { x: minX, y: minY, width, height };
    }
  }, []);

  // Helper function to check if a point is inside an object
  const isPointInObject = useCallback((point: Point, obj: DrawingPath | Shape | TextElement): boolean => {
    const bounds = getBounds(obj);
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width && 
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
  }, [getBounds]);

  // Helper function to move an object by offset
  const moveObject = useCallback((obj: DrawingPath | Shape | TextElement, offset: Point): DrawingPath | Shape | TextElement => {
    if ('points' in obj) {
      // Move path
      return {
        ...obj,
        points: obj.points.map(p => ({ x: p.x + offset.x, y: p.y + offset.y }))
      };
    } else if ('content' in obj) {
      // Move text
      return {
        ...obj,
        position: { x: obj.position.x + offset.x, y: obj.position.y + offset.y }
      };
    } else {
      // Move shape
      return {
        ...obj,
        startPoint: { x: obj.startPoint.x + offset.x, y: obj.startPoint.y + offset.y },
        endPoint: { x: obj.endPoint.x + offset.x, y: obj.endPoint.y + offset.y }
      };
    }
  }, []);

  // Helper function to check if point is on a resize handle or rotation handle
  const getResizeHandle = useCallback((point: Point, bounds: any): string | null => {
    const handleSize = 8 / viewport.scale;
    const tolerance = handleSize / 2;
    const rotationHandleDistance = 20 / viewport.scale; // Distance of rotation handle from object
    
    const handles = [
      { name: 'nw', x: bounds.x, y: bounds.y },
      { name: 'ne', x: bounds.x + bounds.width, y: bounds.y },
      { name: 'sw', x: bounds.x, y: bounds.y + bounds.height },
      { name: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { name: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
      { name: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
      { name: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 },
      { name: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
      { name: 'rotate', x: bounds.x + bounds.width / 2, y: bounds.y - rotationHandleDistance }
    ];
    
    for (const handle of handles) {
      if (Math.abs(point.x - handle.x) <= tolerance && 
          Math.abs(point.y - handle.y) <= tolerance) {
        return handle.name;
      }
    }
    
    return null;
  }, [viewport.scale]);

  // Helper function to get cursor style based on resize handle
  const getCursorStyle = useCallback((handle: string): string => {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nw-resize';
      case 'ne':
      case 'sw':
        return 'ne-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'w':
      case 'e':
        return 'ew-resize';
      case 'rotate':
        return 'grab';
      default:
        return 'default';
    }
  }, []);

  // Helper function to resize an object
  const resizeObject = useCallback((obj: Shape, handle: string, newPoint: Point, originalBounds: any): Shape => {
    if ('points' in obj) return obj; // Can't resize paths yet
    
    let newStartPoint = { ...obj.startPoint };
    let newEndPoint = { ...obj.endPoint };
    
    switch (handle) {
      case 'nw':
        newStartPoint = { x: newPoint.x, y: newPoint.y };
        break;
      case 'ne':
        newStartPoint = { x: obj.startPoint.x, y: newPoint.y };
        newEndPoint = { x: newPoint.x, y: obj.endPoint.y };
        break;
      case 'sw':
        newStartPoint = { x: newPoint.x, y: obj.startPoint.y };
        newEndPoint = { x: obj.endPoint.x, y: newPoint.y };
        break;
      case 'se':
        newEndPoint = { x: newPoint.x, y: newPoint.y };
        break;
      case 'n':
        newStartPoint = { x: obj.startPoint.x, y: newPoint.y };
        break;
      case 's':
        newEndPoint = { x: obj.endPoint.x, y: newPoint.y };
        break;
      case 'w':
        newStartPoint = { x: newPoint.x, y: obj.startPoint.y };
        break;
      case 'e':
        newEndPoint = { x: newPoint.x, y: obj.endPoint.y };
        break;
    }
    
    return {
      ...obj,
      startPoint: newStartPoint,
      endPoint: newEndPoint
    };
  }, []);

  // Helper function to rotate an object
  // Text completion functions
  const completeTextInput = useCallback(() => {
    if (editingText && textInput.trim()) {
      const newText: TextElement = {
        id: editingText.id,
        type: "text",
        position: editingText.position,
        content: textInput.trim(),
        fontSize: fontSize,
        fontFamily: fontFamily,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
        textAlign: textAlign,
        color: strokeColor
      };
      
      const addTextCommand: Command = {
        execute: () => {
          setTexts(prev => [...prev, newText]);
        },
        undo: () => {
          setTexts(prev => prev.filter(t => t.id !== newText.id));
        },
        description: "Add text"
      };
      
      executeCommand(addTextCommand);
    }
    
    setEditingText(null);
    setTextInput("");
  }, [editingText, textInput, fontSize, fontFamily, fontWeight, fontStyle, textAlign, strokeColor, executeCommand]);
  
  const cancelTextInput = useCallback(() => {
    setEditingText(null);
    setTextInput("");
  }, []);

  const rotateObject = useCallback((obj: Shape | DrawingPath, center: Point, currentPoint: Point, initialAngle: number): Shape | DrawingPath => {
    // Calculate current angle from center to current point
    const currentAngle = Math.atan2(currentPoint.y - center.y, currentPoint.x - center.x);
    // Calculate rotation delta
    const rotation = currentAngle - initialAngle;
    
    // Add rotation to the object (in radians)
    const currentRotation = obj.rotation || 0;
    const newRotation = currentRotation + rotation;
    
    return {
      ...obj,
      rotation: newRotation
    };
  }, []);

  // Helper function to undo the last command
  const undo = useCallback(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      history[historyIndex].undo();
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  // Helper function to redo the next command
  const redo = useCallback(() => {
    if (historyIndex + 1 < history.length) {
      const nextIndex = historyIndex + 1;
      history[nextIndex].execute();
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  // Helper function to create state snapshot
  const createStateSnapshot = useCallback((): CanvasState => {
    return {
      paths: [...paths],
      shapes: [...shapes],
      texts: [...texts]
    };
  }, [paths, shapes, texts]);

  // Helper function to restore state from snapshot
  const restoreState = useCallback((state: CanvasState) => {
    setPaths(state.paths);
    setShapes(state.shapes);
    setTexts(state.texts);
  }, []);

  // Helper function to copy selected objects to clipboard
  const copySelectedObjects = useCallback(() => {
    if (selectedObjects.length === 0) return;
    
    const objectsToCopy: (DrawingPath | Shape | TextElement)[] = [];
    
    selectedObjects.forEach(id => {
      const path = paths.find(p => p.id === id);
      const shape = shapes.find(s => s.id === id);
      const text = texts.find(t => t.id === id);
      
      if (path) objectsToCopy.push(path);
      if (shape) objectsToCopy.push(shape);
      if (text) objectsToCopy.push(text);
    });
    
    setClipboard(objectsToCopy);
  }, [selectedObjects, paths, shapes, texts]);

  // Helper function to paste objects from clipboard
  const pasteObjects = useCallback(() => {
    if (clipboard.length === 0) return;
    
    const pastedObjects: string[] = [];
    const offset = { x: 20, y: 20 }; // Offset to avoid pasting on top of original
    
    clipboard.forEach(obj => {
      const newId = crypto.randomUUID();
      pastedObjects.push(newId);
      
      if ('points' in obj) {
        // Path object
        const newPath: DrawingPath = {
          ...obj,
          id: newId,
          points: obj.points.map(p => ({ x: p.x + offset.x, y: p.y + offset.y }))
        };
        setPaths(prev => [...prev, newPath]);
      } else if ('content' in obj) {
        // Text object
        const newText: TextElement = {
          ...obj,
          id: newId,
          position: { x: obj.position.x + offset.x, y: obj.position.y + offset.y }
        };
        setTexts(prev => [...prev, newText]);
      } else {
        // Shape object
        const newShape: Shape = {
          ...obj,
          id: newId,
          startPoint: { x: obj.startPoint.x + offset.x, y: obj.startPoint.y + offset.y },
          endPoint: { x: obj.endPoint.x + offset.x, y: obj.endPoint.y + offset.y }
        };
        setShapes(prev => [...prev, newShape]);
      }
    });
    
    // Select the pasted objects
    setSelectedObjects(pastedObjects);
  }, [clipboard]);

  // Helper function to duplicate selected objects
  const duplicateSelectedObjects = useCallback(() => {
    copySelectedObjects();
    pasteObjects();
  }, [copySelectedObjects, pasteObjects]);

  // Helper function to get the maximum z-index
  const getMaxZIndex = useCallback((): number => {
    const allZIndices = [
      ...paths.map(p => p.zIndex || 0),
      ...shapes.map(s => s.zIndex || 0),
      ...texts.map(t => t.zIndex || 0)
    ];
    return Math.max(0, ...allZIndices);
  }, [paths, shapes, texts]);

  // Helper function to get the minimum z-index
  const getMinZIndex = useCallback((): number => {
    const allZIndices = [
      ...paths.map(p => p.zIndex || 0),
      ...shapes.map(s => s.zIndex || 0),
      ...texts.map(t => t.zIndex || 0)
    ];
    return Math.min(0, ...allZIndices);
  }, [paths, shapes, texts]);

  // Helper function to bring selected objects to front
  const bringToFront = useCallback(() => {
    if (selectedObjects.length === 0) return;
    
    const maxZ = getMaxZIndex();
    const newZIndex = maxZ + 1;
    
    const bringToFrontCommand: Command = {
      execute: () => {
        setPaths(prev => prev.map(path => 
          selectedObjects.includes(path.id) 
            ? { ...path, zIndex: newZIndex }
            : path
        ));
        
        setShapes(prev => prev.map(shape => 
          selectedObjects.includes(shape.id) 
            ? { ...shape, zIndex: newZIndex }
            : shape
        ));
        
        setTexts(prev => prev.map(text => 
          selectedObjects.includes(text.id) 
            ? { ...text, zIndex: newZIndex }
            : text
        ));
      },
      undo: () => {
        // Restore original z-indices (simplified implementation)
        setPaths(prev => prev.map(path => 
          selectedObjects.includes(path.id) 
            ? { ...path, zIndex: path.zIndex ? path.zIndex - 1 : 0 }
            : path
        ));
        
        setShapes(prev => prev.map(shape => 
          selectedObjects.includes(shape.id) 
            ? { ...shape, zIndex: shape.zIndex ? shape.zIndex - 1 : 0 }
            : shape
        ));
        
        setTexts(prev => prev.map(text => 
          selectedObjects.includes(text.id) 
            ? { ...text, zIndex: text.zIndex ? text.zIndex - 1 : 0 }
            : text
        ));
      },
      description: `Bring ${selectedObjects.length} object(s) to front`
    };
    
    executeCommand(bringToFrontCommand);
  }, [selectedObjects, getMaxZIndex, executeCommand]);

  // Helper function to send selected objects to back
  const sendToBack = useCallback(() => {
    if (selectedObjects.length === 0) return;
    
    const minZ = getMinZIndex();
    const newZIndex = minZ - 1;
    
    const sendToBackCommand: Command = {
      execute: () => {
        setPaths(prev => prev.map(path => 
          selectedObjects.includes(path.id) 
            ? { ...path, zIndex: newZIndex }
            : path
        ));
        
        setShapes(prev => prev.map(shape => 
          selectedObjects.includes(shape.id) 
            ? { ...shape, zIndex: newZIndex }
            : shape
        ));
        
        setTexts(prev => prev.map(text => 
          selectedObjects.includes(text.id) 
            ? { ...text, zIndex: newZIndex }
            : text
        ));
      },
      undo: () => {
        // Restore original z-indices (simplified implementation)
        setPaths(prev => prev.map(path => 
          selectedObjects.includes(path.id) 
            ? { ...path, zIndex: path.zIndex ? path.zIndex + 1 : 0 }
            : path
        ));
        
        setShapes(prev => prev.map(shape => 
          selectedObjects.includes(shape.id) 
            ? { ...shape, zIndex: shape.zIndex ? shape.zIndex + 1 : 0 }
            : shape
        ));
        
        setTexts(prev => prev.map(text => 
          selectedObjects.includes(text.id) 
            ? { ...text, zIndex: text.zIndex ? text.zIndex + 1 : 0 }
            : text
        ));
      },
      description: `Send ${selectedObjects.length} object(s) to back`
    };
    
    executeCommand(sendToBackCommand);
  }, [selectedObjects, getMinZIndex, executeCommand]);

  // Helper function to get selected object details
  const getSelectedObjectDetails = useCallback(() => {
    if (selectedObjects.length !== 1) return null;
    
    const selectedId = selectedObjects[0];
    const path = paths.find(p => p.id === selectedId);
    const shape = shapes.find(s => s.id === selectedId);
    const text = texts.find(t => t.id === selectedId);
    
    return path || shape || text || null;
  }, [selectedObjects, paths, shapes, texts]);

  const selectedObject = getSelectedObjectDetails();

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

    // Create sorted arrays by z-index
    const sortedPaths = [...paths].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const sortedTexts = [...texts].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    // Create combined sorted array with object types
    const allObjects: Array<{ obj: DrawingPath | Shape | TextElement; objType: 'path' | 'shape' | 'text' }> = [
      ...sortedPaths.map(p => ({ obj: p, objType: 'path' as const })),
      ...sortedShapes.map(s => ({ obj: s, objType: 'shape' as const })),
      ...sortedTexts.map(t => ({ obj: t, objType: 'text' as const }))
    ].sort((a, b) => (a.obj.zIndex || 0) - (b.obj.zIndex || 0));

    allObjects.forEach(({ obj, objType }) => {
      if (objType === 'path') {
        const path = obj as DrawingPath;
        if (path.points.length > 1) {
          const isSelected = selectedObjects.includes(path.id);
          const offset = isSelected && isDragging ? dragOffset : { x: 0, y: 0 };
          
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.width;
          ctx.globalAlpha = isSelected && isDragging ? 0.7 : 1;
          
          ctx.beginPath();
          ctx.moveTo(path.points[0].x + offset.x, path.points[0].y + offset.y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x + offset.x, path.points[i].y + offset.y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Draw selection indicator for paths
          if (isSelected) {
            const originalPath = path;
            const previewPath = isDragging ? moveObject(originalPath, offset) as DrawingPath : originalPath;
            const bounds = getBounds(previewPath);
            
            ctx.strokeStyle = "#007bff";
            ctx.lineWidth = 2 / viewport.scale;
            ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            ctx.setLineDash([]);
          }
        }
      } else if (objType === 'shape') {
        const shape = obj as Shape;
        const isSelected = selectedObjects.includes(shape.id);
        const offset = isSelected && isDragging ? dragOffset : { x: 0, y: 0 };
        const previewShape = isSelected && isDragging ? moveObject(shape, offset) as Shape : shape;
        
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.width;
        ctx.globalAlpha = isSelected && isDragging ? 0.7 : 1;
        
        if (shape.fillColor && shape.fillColor !== "transparent") {
          ctx.fillStyle = shape.fillColor;
        }

        if (shape.type === "rectangle") {
          const width = previewShape.endPoint.x - previewShape.startPoint.x;
          const height = previewShape.endPoint.y - previewShape.startPoint.y;
          
          ctx.beginPath();
          ctx.rect(previewShape.startPoint.x, previewShape.startPoint.y, width, height);
          
          if (shape.fillColor && shape.fillColor !== "transparent") {
            ctx.fill();
          }
          ctx.stroke();
        } else if (shape.type === "circle") {
          const centerX = (previewShape.startPoint.x + previewShape.endPoint.x) / 2;
          const centerY = (previewShape.startPoint.y + previewShape.endPoint.y) / 2;
          const radiusX = Math.abs(previewShape.endPoint.x - previewShape.startPoint.x) / 2;
          const radiusY = Math.abs(previewShape.endPoint.y - previewShape.startPoint.y) / 2;
          const radius = Math.min(radiusX, radiusY);

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          
          if (shape.fillColor && shape.fillColor !== "transparent") {
            ctx.fill();
          }
          ctx.stroke();
        }
        
        ctx.globalAlpha = 1;

        // Draw selection indicator for shapes
        if (isSelected) {
          const bounds = getBounds(previewShape);
          ctx.strokeStyle = "#007bff";
          ctx.lineWidth = 2 / viewport.scale;
          ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
          ctx.setLineDash([]);
          
          // Draw selection handles (8 handles: 4 corners + 4 edges)
          const handleSize = 8 / viewport.scale;
          ctx.fillStyle = "#007bff";
          const handles = [
            { x: bounds.x, y: bounds.y }, // nw
            { x: bounds.x + bounds.width, y: bounds.y }, // ne
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // se
            { x: bounds.x, y: bounds.y + bounds.height }, // sw
            { x: bounds.x + bounds.width / 2, y: bounds.y }, // n
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // s
            { x: bounds.x, y: bounds.y + bounds.height / 2 }, // w
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 } // e
          ];
          
          handles.forEach(handle => {
            ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
          });
          
          // Draw rotation handle
          const rotationHandleDistance = 20 / viewport.scale;
          const rotationHandle = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y - rotationHandleDistance
          };
          
          // Draw line from top center to rotation handle
          ctx.strokeStyle = "#007bff";
          ctx.lineWidth = 1 / viewport.scale;
          ctx.beginPath();
          ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
          ctx.lineTo(rotationHandle.x, rotationHandle.y);
          ctx.stroke();
          
          // Draw rotation handle circle
          ctx.fillStyle = "#007bff";
          ctx.beginPath();
          ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1 / viewport.scale;
          ctx.stroke();
        }
      } else if (objType === 'text') {
        const text = obj as TextElement;
        const isSelected = selectedObjects.includes(text.id);
        const offset = isSelected && isDragging ? dragOffset : { x: 0, y: 0 };
        const previewText = isSelected && isDragging ? moveObject(text, offset) as TextElement : text;
        
        ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
        ctx.fillStyle = text.color;
        ctx.textBaseline = 'top';
        
        // Apply text alignment
        const textMetrics = ctx.measureText(previewText.content);
        let xPos = previewText.position.x;
        
        if (text.textAlign === 'center') {
          xPos = previewText.position.x - textMetrics.width / 2;
        } else if (text.textAlign === 'right') {
          xPos = previewText.position.x - textMetrics.width;
        }
        
        ctx.fillText(previewText.content, xPos, previewText.position.y);
        
        // Draw selection indicator for texts
        if (isSelected) {
          const bounds = getBounds(previewText);
          ctx.strokeStyle = "#007bff";
          ctx.lineWidth = 2 / viewport.scale;
          ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
          ctx.setLineDash([]);
          
          // Draw selection handles
          const handleSize = 8 / viewport.scale;
          ctx.fillStyle = "#007bff";
          const handles = [
            { x: bounds.x, y: bounds.y }, // nw
            { x: bounds.x + bounds.width, y: bounds.y }, // ne
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // se
            { x: bounds.x, y: bounds.y + bounds.height }, // sw
          ];
          
          handles.forEach(handle => {
            ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
          });
        }
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
  }, [paths, shapes, texts, currentPath, currentShape, isDrawing, strokeColor, strokeWidth, fillColor, viewport, selectedObjects, getBounds, isDragging, dragOffset, moveObject]);

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

    if (currentTool === "select") {
      // Check if clicking on a resize handle first
      let resizeHandleFound = null;
      let targetObject = null;
      
      if (selectedObjects.length === 1) {
        // Only allow resizing when single object is selected
        const selectedId = selectedObjects[0];
        const obj = [...shapes, ...paths, ...texts].find(o => o.id === selectedId);
        
        if (obj && !('points' in obj)) { // Only shapes can be resized for now
          const bounds = getBounds(obj);
          resizeHandleFound = getResizeHandle(canvasPoint, bounds);
          if (resizeHandleFound) {
            targetObject = obj;
          }
        }
      }
      
      if (resizeHandleFound && targetObject) {
        if (resizeHandleFound === 'rotate') {
          // Start rotating
          const bounds = getBounds(targetObject);
          const center = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
          };
          const initialAngle = Math.atan2(canvasPoint.y - center.y, canvasPoint.x - center.x);
          setIsRotating(true);
          setRotationStart({
            point: canvasPoint,
            center,
            initialRotation: targetObject.rotation || 0
          });
        } else {
          // Start resizing
          setIsResizing(true);
          setResizeHandle(resizeHandleFound);
          setResizeStart({
            point: canvasPoint,
            bounds: getBounds(targetObject)
          });
        }
      } else {
        // Find object under cursor (search from top to bottom)
        let clickedObject: string | null = null;
        
        // Check texts first (they're drawn on top)
        for (let i = texts.length - 1; i >= 0; i--) {
          if (isPointInObject(canvasPoint, texts[i])) {
            clickedObject = texts[i].id;
            break;
          }
        }
        
        // If no text clicked, check shapes
        if (!clickedObject) {
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (isPointInObject(canvasPoint, shapes[i])) {
              clickedObject = shapes[i].id;
              break;
            }
          }
        }
        
        // If no shape clicked, check paths
        if (!clickedObject) {
          for (let i = paths.length - 1; i >= 0; i--) {
            if (isPointInObject(canvasPoint, paths[i])) {
              clickedObject = paths[i].id;
              break;
            }
          }
        }

        if (clickedObject) {
          // Handle selection
          if (e.ctrlKey || e.metaKey) {
            // Multi-select: toggle selection
            setSelectedObjects(prev => 
              prev.includes(clickedObject!) 
                ? prev.filter(id => id !== clickedObject)
                : [...prev, clickedObject!]
            );
          } else {
            // Single select (if not already selected)
            if (!selectedObjects.includes(clickedObject)) {
              setSelectedObjects([clickedObject]);
            }
          }
          
          // Start drag if object is selected
          if (selectedObjects.includes(clickedObject) || !e.ctrlKey) {
            setIsDragging(true);
            setDragStart(canvasPoint);
            setDragOffset({ x: 0, y: 0 });
          }
        } else {
          // Clicked on empty space - clear selection
          setSelectedObjects([]);
        }
      }
    } else {
      // Drawing tools
      setIsDrawing(true);

      if (currentTool === "pen") {
        setCurrentPath([canvasPoint]);
      } else if (currentTool === "rectangle" || currentTool === "circle") {
        setCurrentShape({
          type: currentTool,
          startPoint: canvasPoint,
          endPoint: canvasPoint,
        });
      } else if (currentTool === "text") {
        // Start text editing
        setEditingText({
          id: crypto.randomUUID(),
          position: canvasPoint
        });
        setTextInput("");
        setIsDrawing(false); // Don't set drawing mode for text
      }
    }
  }, [currentTool, screenToCanvas, shapes, paths, isPointInObject, selectedObjects, getBounds, getResizeHandle]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPoint = screenToCanvas(screenPoint);

    if (currentTool === "select") {
      if (isResizing && resizeHandle && resizeStart && selectedObjects.length === 1) {
        // Handle resizing
        const selectedId = selectedObjects[0];
        const obj = shapes.find(s => s.id === selectedId);
        if (obj) {
          const newShape = resizeObject(obj, resizeHandle, canvasPoint, resizeStart.bounds);
          setShapes(prev => prev.map(s => s.id === selectedId ? newShape : s));
        }
      } else if (isRotating && rotationStart && selectedObjects.length === 1) {
        // Handle rotation
        const selectedId = selectedObjects[0];
        // Find object in both shapes and paths
        const shapeObj = shapes.find(s => s.id === selectedId);
        const pathObj = paths.find(p => p.id === selectedId);
        
        if (shapeObj) {
          const initialAngle = Math.atan2(rotationStart.point.y - rotationStart.center.y, rotationStart.point.x - rotationStart.center.x);
          const rotatedShape = rotateObject(shapeObj, rotationStart.center, canvasPoint, initialAngle);
          setShapes(prev => prev.map(s => s.id === selectedId ? rotatedShape as Shape : s));
        } else if (pathObj) {
          const initialAngle = Math.atan2(rotationStart.point.y - rotationStart.center.y, rotationStart.point.x - rotationStart.center.x);
          const rotatedPath = rotateObject(pathObj, rotationStart.center, canvasPoint, initialAngle);
          setPaths(prev => prev.map(p => p.id === selectedId ? rotatedPath as DrawingPath : p));
        }
      } else if (isDragging && dragStart && selectedObjects.length > 0) {
        // Calculate drag offset
        const newOffset = {
          x: canvasPoint.x - dragStart.x,
          y: canvasPoint.y - dragStart.y
        };
        setDragOffset(newOffset);
      } else if (selectedObjects.length === 1) {
        // Update cursor style when hovering over resize handles
        const selectedId = selectedObjects[0];
        const obj = [...shapes, ...paths].find(o => o.id === selectedId);
        
        if (obj && !('points' in obj)) { // Only shapes can be resized for now
          const bounds = getBounds(obj);
          const handle = getResizeHandle(canvasPoint, bounds);
          
          if (handle) {
            const newCursor = getCursorStyle(handle);
            if (newCursor !== cursorStyle) {
              setCursorStyle(newCursor);
            }
          } else if (cursorStyle !== "default") {
            setCursorStyle("default");
          }
        }
      }
    } else if (isDrawing) {
      if (currentTool === "pen") {
        setCurrentPath(prev => [...prev, canvasPoint]);
      } else if ((currentTool === "rectangle" || currentTool === "circle") && currentShape) {
        setCurrentShape(prev => prev ? {
          ...prev,
          endPoint: canvasPoint
        } : null);
      }
    }
  }, [isDrawing, isDragging, isResizing, currentTool, screenToCanvas, currentShape, dragStart, selectedObjects, resizeHandle, resizeStart, shapes, resizeObject, getBounds, getResizeHandle, getCursorStyle, cursorStyle, paths]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && selectedObjects.length > 0 && (dragOffset.x !== 0 || dragOffset.y !== 0)) {
      // Apply drag movement to selected objects using command pattern
      const beforeState = createStateSnapshot();
      
      const moveCommand: Command = {
        execute: () => {
          setPaths(prev => prev.map(path => 
            selectedObjects.includes(path.id) 
              ? moveObject(path, dragOffset) as DrawingPath
              : path
          ));
          
          setShapes(prev => prev.map(shape => 
            selectedObjects.includes(shape.id) 
              ? moveObject(shape, dragOffset) as Shape
              : shape
          ));
          
          setTexts(prev => prev.map(text => 
            selectedObjects.includes(text.id) 
              ? moveObject(text, dragOffset) as TextElement
              : text
          ));
        },
        undo: () => {
          restoreState(beforeState);
        },
        description: `Move ${selectedObjects.length} object(s)`
      };
      
      executeCommand(moveCommand);
    }
    
    if (isDrawing) {
      if (currentTool === "pen" && currentPath.length > 1) {
        const newPath: DrawingPath = {
          id: crypto.randomUUID(),
          points: [...currentPath],
          color: strokeColor,
          width: strokeWidth
        };
        
        const addPathCommand: Command = {
          execute: () => {
            setPaths(prev => [...prev, newPath]);
          },
          undo: () => {
            setPaths(prev => prev.filter(p => p.id !== newPath.id));
          },
          description: "Draw path"
        };
        
        executeCommand(addPathCommand);
      } else if ((currentTool === "rectangle" || currentTool === "circle") && currentShape?.startPoint && currentShape?.endPoint) {
        const newShape: Shape = {
          id: crypto.randomUUID(),
          type: currentShape.type as "rectangle" | "circle",
          startPoint: currentShape.startPoint,
          endPoint: currentShape.endPoint,
          color: strokeColor,
          width: strokeWidth,
          fillColor: fillColor
        };
        
        const addShapeCommand: Command = {
          execute: () => {
            setShapes(prev => [...prev, newShape]);
          },
          undo: () => {
            setShapes(prev => prev.filter(s => s.id !== newShape.id));
          },
          description: `Draw ${newShape.type}`
        };
        
        executeCommand(addShapeCommand);
      }
    }
    
    // Reset all interaction states
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setCurrentPath([]);
    setCurrentShape(null);
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
    setResizeHandle(null);
    setResizeStart(null);
    setRotationStart(null);
  }, [isDrawing, isDragging, currentTool, currentPath, currentShape, strokeColor, strokeWidth, fillColor, selectedObjects, dragOffset, moveObject, createStateSnapshot, executeCommand, restoreState]);

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

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjects.length > 0) {
          // Delete selected objects
          setPaths(prev => prev.filter(path => !selectedObjects.includes(path.id)));
          setShapes(prev => prev.filter(shape => !selectedObjects.includes(shape.id)));
          setTexts(prev => prev.filter(text => !selectedObjects.includes(text.id)));
          setSelectedObjects([]);
        }
      } else if (e.key === 'Escape') {
        // Clear selection
        setSelectedObjects([]);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        // Copy selected objects
        e.preventDefault();
        copySelectedObjects();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        // Paste objects
        e.preventDefault();
        pasteObjects();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        // Duplicate objects
        e.preventDefault();
        duplicateSelectedObjects();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        // Select all objects
        e.preventDefault();
        const allIds = [...paths.map(p => p.id), ...shapes.map(s => s.id)];
        setSelectedObjects(allIds);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        // Undo
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        // Redo
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        // Bring to front
        e.preventDefault();
        bringToFront();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        // Send to back
        e.preventDefault();
        sendToBack();
      } else if (e.key >= '1' && e.key <= '6') {
        // Tool shortcuts (1-6)
        e.preventDefault();
        const toolMap: { [key: string]: ToolType } = {
          '1': 'select',
          '2': 'pen',
          '3': 'rectangle',
          '4': 'circle',
          '5': 'text',
          '6': 'eraser'
        };
        const newTool = toolMap[e.key];
        if (newTool) {
          setCurrentTool(newTool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjects, copySelectedObjects, pasteObjects, duplicateSelectedObjects, paths, shapes, undo, redo, bringToFront, sendToBack]);

  return (
    <div className="h-screen w-full bg-gray-50 relative overflow-hidden flex">
      {/* Main Canvas Area */}
      <div className="flex-1 relative">
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

          {/* Stroke Colors */}
          <div className="text-xs font-medium mb-1">Stroke:</div>
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded border-2 hover:border-gray-500 ${
                  strokeColor === color ? "border-blue-500" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setStrokeColor(color)}
                title={`Stroke: ${color}`}
              />
            ))}
          </div>

          {/* Fill Colors */}
          <div className="text-xs font-medium mb-1">Fill:</div>
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            <button
              className={`w-6 h-6 rounded border-2 hover:border-gray-500 ${
                fillColor === "transparent" ? "border-blue-500" : "border-gray-300"
              }`}
              style={{ 
                backgroundColor: "white",
                backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px"
              }}
              onClick={() => setFillColor("transparent")}
              title="No fill"
            />
            {colors.map((color) => (
              <button
                key={`fill-${color}`}
                className={`w-6 h-6 rounded border-2 hover:border-gray-500 ${
                  fillColor === color ? "border-blue-500" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFillColor(color)}
                title={`Fill: ${color}`}
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

          {/* Font Controls */}
          {currentTool === "text" && (
            <>
              <div className="text-xs font-medium mb-1">Font:</div>
              
              {/* Font Family */}
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="text-xs p-1 border rounded w-full max-w-[120px]"
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times</option>
                <option value="'Courier New', monospace">Courier</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Georgia, serif">Georgia</option>
              </select>

              {/* Font Size */}
              <div className="flex items-center gap-2">
                <span className="text-xs">Size:</span>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-16 h-2"
                />
                <span className="text-xs w-8">{fontSize}</span>
              </div>

              {/* Font Style Buttons */}
              <div className="flex gap-1">
                <Button
                  variant={fontWeight === "bold" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")}
                  className="text-xs px-2"
                >
                  <strong>B</strong>
                </Button>
                <Button
                  variant={fontStyle === "italic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontStyle(fontStyle === "italic" ? "normal" : "italic")}
                  className="text-xs px-2"
                >
                  <em>I</em>
                </Button>
              </div>

              {/* Text Alignment */}
              <div className="flex gap-1">
                <Button
                  variant={textAlign === "left" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextAlign("left")}
                  className="text-xs px-2"
                  title="左对齐"
                >
                  ⫷
                </Button>
                <Button
                  variant={textAlign === "center" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextAlign("center")}
                  className="text-xs px-2"
                  title="居中对齐"
                >
                  ⫸
                </Button>
                <Button
                  variant={textAlign === "right" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextAlign("right")}
                  className="text-xs px-2"
                  title="右对齐"
                >
                  ⫹
                </Button>
              </div>
            </>
          )}

          {/* Clear Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaths([]);
              setShapes([]);
            }}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          display: "block", 
          width: "100%", 
          height: "100%",
          cursor: currentTool === "select" ? cursorStyle : "crosshair"
        }}
      />
      
      {/* Text Input Overlay */}
      {editingText && (
        <div 
          className="absolute bg-transparent pointer-events-none"
          style={{
            left: (editingText.position.x * viewport.scale + viewport.offsetX) + 'px',
            top: (editingText.position.y * viewport.scale + viewport.offsetY) + 'px',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                completeTextInput();
              } else if (e.key === 'Escape') {
                cancelTextInput();
              }
            }}
            onBlur={completeTextInput}
            autoFocus
            className="pointer-events-auto bg-transparent border-none outline-none text-black"
            style={{
              fontSize: fontSize + 'px',
              fontFamily: fontFamily,
              fontWeight: fontWeight,
              fontStyle: fontStyle,
              textAlign: textAlign,
              color: strokeColor,
              minWidth: '100px'
            }}
            placeholder="Type text..."
          />
        </div>
      )}

      {/* Board Info */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow text-sm">
        <h3 className="font-medium mb-1">Board: {boardId}</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Tools: Select, Pen, Rectangle, Circle</li>
          <li>• Select: Click to select, Ctrl+click for multi-select</li>
          <li>• Drag selected objects to move them</li>
          <li>• Resize: Drag corner/edge handles when selected</li>
          <li>• Keyboard: Ctrl+C/V (copy/paste), Ctrl+D (duplicate), Ctrl+A (select all)</li>
          <li>• Delete/Backspace to remove selected, Esc to clear selection</li>
          <li>• Layering: Ctrl+] (bring to front), Ctrl+[ (send to back)</li>
          <li>• Tools: 1(Select), 2(Pen), 3(Rectangle), 4(Circle), 5(Text), 6(Eraser)</li>
          <li>• Objects: {paths.length + shapes.length + texts.length} ({selectedObjects.length} selected)</li>
          <li>• Clipboard: {clipboard.length} objects | Zoom: {Math.round(viewport.scale * 100)}%</li>
        </ul>
      </div>
      </div>

      {/* Properties Panel */}
      {selectedObject && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-medium mb-3">属性面板</h3>
          
          {/* Object Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              对象类型
            </label>
            <div className="text-sm text-gray-600 capitalize">
              {'points' in selectedObject ? '路径' : 
               'content' in selectedObject ? '文本' : 
               selectedObject.type === 'rectangle' ? '矩形' : '圆形'}
            </div>
          </div>

          {/* Common Properties */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              颜色
            </label>
            <input
              type="color"
              value={selectedObject.color}
              onChange={(e) => {
                // Update object color
                if ('points' in selectedObject) {
                  setPaths(prev => prev.map(p => 
                    p.id === selectedObject.id ? { ...p, color: e.target.value } : p
                  ));
                } else if ('content' in selectedObject) {
                  setTexts(prev => prev.map(t => 
                    t.id === selectedObject.id ? { ...t, color: e.target.value } : t
                  ));
                } else {
                  setShapes(prev => prev.map(s => 
                    s.id === selectedObject.id ? { ...s, color: e.target.value } : s
                  ));
                }
              }}
              className="w-full h-8 border rounded"
            />
          </div>

          {/* Width/Size for paths and shapes */}
          {('width' in selectedObject) && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                线宽
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={selectedObject.width}
                onChange={(e) => {
                  const newWidth = Number(e.target.value);
                  if ('points' in selectedObject) {
                    setPaths(prev => prev.map(p => 
                      p.id === selectedObject.id ? { ...p, width: newWidth } : p
                    ));
                  } else {
                    setShapes(prev => prev.map(s => 
                      s.id === selectedObject.id ? { ...s, width: newWidth } : s
                    ));
                  }
                }}
                className="w-full"
              />
              <div className="text-sm text-gray-600 mt-1">{selectedObject.width}px</div>
            </div>
          )}

          {/* Fill Color for shapes */}
          {('fillColor' in selectedObject) && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                填充颜色
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedObject.fillColor === 'transparent' ? '#ffffff' : selectedObject.fillColor}
                  onChange={(e) => {
                    setShapes(prev => prev.map(s => 
                      s.id === selectedObject.id ? { ...s, fillColor: e.target.value } : s
                    ));
                  }}
                  className="flex-1 h-8 border rounded"
                  disabled={selectedObject.fillColor === 'transparent'}
                />
                <button
                  onClick={() => {
                    setShapes(prev => prev.map(s => 
                      s.id === selectedObject.id ? { 
                        ...s, 
                        fillColor: s.fillColor === 'transparent' ? '#ffffff' : 'transparent' 
                      } : s
                    ));
                  }}
                  className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                >
                  {selectedObject.fillColor === 'transparent' ? '启用' : '透明'}
                </button>
              </div>
            </div>
          )}

          {/* Text Properties */}
          {('content' in selectedObject) && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文本内容
                </label>
                <textarea
                  value={selectedObject.content}
                  onChange={(e) => {
                    setTexts(prev => prev.map(t => 
                      t.id === selectedObject.id ? { ...t, content: e.target.value } : t
                    ));
                  }}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字体大小
                </label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={selectedObject.fontSize}
                  onChange={(e) => {
                    setTexts(prev => prev.map(t => 
                      t.id === selectedObject.id ? { ...t, fontSize: Number(e.target.value) } : t
                    ));
                  }}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{selectedObject.fontSize}px</div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字体系列
                </label>
                <select
                  value={selectedObject.fontFamily}
                  onChange={(e) => {
                    setTexts(prev => prev.map(t => 
                      t.id === selectedObject.id ? { ...t, fontFamily: e.target.value } : t
                    ));
                  }}
                  className="w-full p-1 border rounded text-sm"
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times</option>
                  <option value="'Courier New', monospace">Courier</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Georgia, serif">Georgia</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  样式
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTexts(prev => prev.map(t => 
                        t.id === selectedObject.id ? { 
                          ...t, 
                          fontWeight: t.fontWeight === 'bold' ? 'normal' : 'bold' 
                        } : t
                      ));
                    }}
                    className={`px-3 py-1 text-sm border rounded ${
                      selectedObject.fontWeight === 'bold' ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                  >
                    <strong>粗体</strong>
                  </button>
                  <button
                    onClick={() => {
                      setTexts(prev => prev.map(t => 
                        t.id === selectedObject.id ? { 
                          ...t, 
                          fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic' 
                        } : t
                      ));
                    }}
                    className={`px-3 py-1 text-sm border rounded ${
                      selectedObject.fontStyle === 'italic' ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                  >
                    <em>斜体</em>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  对齐方式
                </label>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => {
                        setTexts(prev => prev.map(t => 
                          t.id === selectedObject.id ? { ...t, textAlign: align } : t
                        ));
                      }}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${
                        selectedObject.textAlign === align ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                    >
                      {align === 'left' ? '左对齐' : align === 'center' ? '居中' : '右对齐'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Z-Index */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              层级 (Z-Index)
            </label>
            <div className="text-sm text-gray-600">
              {selectedObject.zIndex || 0}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={bringToFront}
                className="flex-1 px-3 py-1 text-xs border rounded hover:bg-gray-50"
              >
                置顶
              </button>
              <button
                onClick={sendToBack}
                className="flex-1 px-3 py-1 text-xs border rounded hover:bg-gray-50"
              >
                置底
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}