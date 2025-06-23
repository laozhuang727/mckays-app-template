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

// Import our modular components
import { 
  ToolType, 
  Point, 
  DrawingPath, 
  Shape, 
  TextElement, 
  CanvasBoardProps, 
  Viewport,
  MarqueeSelection 
} from './types';
import { screenToCanvas, setupCanvas } from './canvas-utils';
import { DrawingEngine } from './drawing-engine';
import { CommandSystem, createAddPathCommand, createAddShapeCommand, createAddTextCommand } from './command-system';
import { SelectionSystem } from './selection-system';

export function CanvasBoard({ boardId }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Core state
  const [currentTool, setCurrentTool] = useState<ToolType>("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [texts, setTexts] = useState<TextElement[]>([]);
  
  // Use refs to avoid dependencies in callbacks
  const pathsRef = useRef(paths);
  const shapesRef = useRef(shapes);
  const textsRef = useRef(texts);
  
  // Update refs when state changes
  useEffect(() => { pathsRef.current = paths; }, [paths]);
  useEffect(() => { shapesRef.current = shapes; }, [shapes]);
  useEffect(() => { textsRef.current = texts; }, [texts]);
  
  // Drawing state
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentShape, setCurrentShape] = useState<Partial<Shape> | null>(null);
  
  // Drag state
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialBounds, setInitialBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [initialObjects, setInitialObjects] = useState<{ paths: DrawingPath[]; shapes: Shape[]; texts: TextElement[] } | null>(null);
  
  // Clipboard state
  const [clipboard, setClipboard] = useState<(DrawingPath | Shape | TextElement)[]>([]);
  
  // Text editing state
  const [editingText, setEditingText] = useState<{ id: string; position: Point } | null>(null);
  const [textInput, setTextInput] = useState("");
  
  // Style state
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState("transparent");
  
  // Selection and interaction state
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Marquee selection state
  const [marqueeSelection, setMarqueeSelection] = useState<MarqueeSelection | null>(null);
  
  // Debug selection state changes
  useEffect(() => {
    console.log('📝 Canvas selectedObjects state changed to:', selectedObjects);
    setDebugInfo(`选中更新: ${selectedObjects.join(', ')} (${new Date().toLocaleTimeString()})`);
  }, [selectedObjects]);
  
  // Debug text editing state changes
  useEffect(() => {
    console.log('📝 editingText状态变化:', editingText);
    if (editingText) {
      setDebugInfo(`文本编辑中: ID=${editingText.id} 位置(${editingText.position.x.toFixed(0)},${editingText.position.y.toFixed(0)})`);
    }
  }, [editingText]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [cursorStyle, setCursorStyle] = useState<string>("default");
  
  // Viewport state
  const [viewport, setViewport] = useState<Viewport>({
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });

  // System instances
  const [drawingEngine, setDrawingEngine] = useState<DrawingEngine | null>(null);
  const [commandSystem] = useState(new CommandSystem());
  const [selectionSystem] = useState(new SelectionSystem((newSelection: string[]) => {
    console.log('🔔 SelectionSystem callback triggered with:', newSelection);
    setSelectedObjects(newSelection);
    // 移除异步延迟，立即重绘以确保状态同步
    // 注意：这里直接使用newSelection而不是依赖React状态
    if (drawingEngine && canvasRef.current) {
      const canvas = canvasRef.current;
      drawingEngine.renderAll(
        paths,
        shapes,
        texts,
        newSelection, // 使用最新的选择状态，而不是可能过时的selectedObjects
        currentPath,
        currentShape,
        editingText,
        textInput,
        strokeColor,
        strokeWidth,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        canvas.width / (window.devicePixelRatio || 1),
        canvas.height / (window.devicePixelRatio || 1),
        marqueeSelection
      );
    }
  }));

  const colors = [
    "#000000", "#ff0000", "#00ff00", "#0000ff", 
    "#ffff00", "#ff00ff", "#00ffff", "#ffa500"
  ];

  // Redraw canvas
  const redraw = useCallback(() => {
    if (!drawingEngine || !canvasRef.current) return;
    const canvas = canvasRef.current;
    drawingEngine.renderAll(
      paths,
      shapes,
      texts,
      selectedObjects,
      currentPath,
      currentShape,
      editingText,
      textInput,
      strokeColor,
      strokeWidth,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      canvas.width / (window.devicePixelRatio || 1),
      canvas.height / (window.devicePixelRatio || 1),
      marqueeSelection
    );
  }, [
    drawingEngine, paths, shapes, texts, selectedObjects, currentPath, currentShape,
    editingText, textInput, strokeColor, strokeWidth, fontSize, fontFamily, fontWeight, fontStyle, marqueeSelection
  ]);

  // Initialize canvas and drawing engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas);
    const engine = new DrawingEngine(ctx, viewport);
    setDrawingEngine(engine);
    const handleResize = () => {
      const newCtx = setupCanvas(canvas);
      const newEngine = new DrawingEngine(newCtx, viewport);
      setDrawingEngine(newEngine);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewport]);

  // Update drawing engine viewport when viewport changes
  useEffect(() => {
    if (drawingEngine) {
      drawingEngine.updateViewport(viewport);
    }
  }, [viewport, drawingEngine]);

  // Redraw when state changes
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    // Prevent any interference with key detection
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPoint = screenToCanvas(screenPoint, viewport);
    
    console.log('🐱 MouseDown Event:', {
      button: e.button,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      nativeEvent: {
        ctrlKey: e.nativeEvent.ctrlKey,
        metaKey: e.nativeEvent.metaKey,
        altKey: e.nativeEvent.altKey
      }
    });
    
    console.log('🔑 Key State Details:', {
      reactEvent: { ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
      nativeEvent: { ctrl: e.nativeEvent.ctrlKey, meta: e.nativeEvent.metaKey, alt: e.nativeEvent.altKey },
      isMultiSelect: e.ctrlKey || e.metaKey,
      currentTool: currentTool
    });

    if (currentTool === "select") {
      // Check if clicking on a resize handle first
      const handle = selectionSystem.getHandleAtPoint(canvasPoint, paths, shapes, texts, selectedObjects);
      
      if (handle) {
        setResizeHandle(handle);
        setDragStart(canvasPoint);
        setIsDragging(true);
        
        // Store initial bounds and objects for resizing
        const bounds = selectionSystem.getSelectionBounds(paths, shapes, texts, selectedObjects);
        setInitialBounds(bounds);
        setInitialObjects({ paths: [...paths], shapes: [...shapes], texts: [...texts] });
      } else {
        // Debug key states
        const keyInfo = {
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          isMultiSelect: e.ctrlKey || e.metaKey,
          canvasPoint: canvasPoint
        };
        console.log('🔍 Key Detection:', keyInfo);
        setDebugInfo(`点击: Ctrl=${e.ctrlKey} Cmd=${e.metaKey} 位置(${canvasPoint.x.toFixed(0)},${canvasPoint.y.toFixed(0)})`);
        
        // First check if we're clicking on an object
        const objectAtPoint = selectionSystem.findObjectAtPoint(canvasPoint, pathsRef.current, shapesRef.current, textsRef.current);
        
        // Determine behavior based on click type and target
        if (objectAtPoint) {
          if (!e.ctrlKey && !e.metaKey) {
            // Normal click on object
            if (selectedObjects.includes(objectAtPoint)) {
              // Clicked on already selected object - keep current selection and start drag
              setIsDragging(true);
              setDragStart(canvasPoint);
              setDebugInfo(`多选拖拽: ${selectedObjects.length} 个对象`);
            } else {
              // Clicked on unselected object - select it and start drag
              selectionSystem.selectSingle(objectAtPoint);
              setIsDragging(true);
              setDragStart(canvasPoint);
              setDebugInfo(`单选并拖拽: ${objectAtPoint}`);
            }
          } else {
            // Ctrl+click behavior
            if (selectedObjects.includes(objectAtPoint)) {
              if (selectedObjects.length > 1) {
                // Multiple objects selected - remove this one from selection
                selectionSystem.removeFromSelection(objectAtPoint, selectedObjects);
                setDebugInfo(`从多选中移除: ${objectAtPoint}`);
              } else {
                // Only one object selected - start drag
                setIsDragging(true);
                setDragStart(canvasPoint);
                setDebugInfo(`单选拖拽: ${objectAtPoint}`);
              }
            } else {
              // Ctrl+click on unselected object - add to selection
              selectionSystem.addToSelection(objectAtPoint, selectedObjects);
              setDebugInfo(`添加到选择: ${objectAtPoint}`);
            }
          }
        } else {
          // Clicked on empty space
          if (!e.ctrlKey && !e.metaKey) {
            // Clear selection and start marquee selection
            selectionSystem.clearSelection();
            setMarqueeSelection({
              startPoint: canvasPoint,
              endPoint: canvasPoint,
              isActive: true
            });
            setDebugInfo(`开始框选`);
          } else {
            // Ctrl+click on empty space - start additive marquee selection
            setMarqueeSelection({
              startPoint: canvasPoint,
              endPoint: canvasPoint,
              isActive: true
            });
            setDebugInfo(`开始追加框选`);
          }
        }
      }
    } else if (currentTool === "pen") {
      setIsDrawing(true);
      setCurrentPath([canvasPoint]);
    } else if (currentTool === "rectangle" || currentTool === "circle") {
      setIsDrawing(true);
      setCurrentShape({
        type: currentTool,
        startPoint: canvasPoint,
        endPoint: canvasPoint,
        color: strokeColor,
        width: strokeWidth,
        fillColor: fillColor
      });
    } else if (currentTool === "text") {
      const textId = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔤 文本工具点击:', { textId, position: canvasPoint, viewport });
      
      // 清除任何现有的编辑状态
      if (editingText) {
        setEditingText(null);
        setTextInput("");
      }
      
      // 设置新的编辑状态
      setTimeout(() => {
        setEditingText({ id: textId, position: canvasPoint });
        setTextInput("");
        setDebugInfo(`文本编辑开始: ${textId} 位置(${canvasPoint.x.toFixed(0)},${canvasPoint.y.toFixed(0)})`);
      }, 10);
    } else if (currentTool === "eraser") {
      // Eraser tool - delete objects at point and enable dragging for continuous erasing
      setIsDrawing(true);
      const objectAtPoint = selectionSystem.findObjectAtPoint(canvasPoint, pathsRef.current, shapesRef.current, textsRef.current);
      if (objectAtPoint) {
        // Delete the object that was clicked
        setPaths(prev => prev.filter(p => p.id !== objectAtPoint));
        setShapes(prev => prev.filter(s => s.id !== objectAtPoint));
        setTexts(prev => prev.filter(t => t.id !== objectAtPoint));
        setDebugInfo(`已删除对象: ${objectAtPoint}`);
      }
    }
  }, [currentTool, viewport, strokeColor, strokeWidth, fillColor, paths, shapes, texts, selectionSystem, selectedObjects, editingText]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPoint = screenToCanvas(screenPoint, viewport);

    if (isDrawing && currentTool === "pen") {
      setCurrentPath(prev => [...prev, canvasPoint]);
    } else if (isDrawing && currentTool === "eraser") {
      // Continuous erasing while dragging
      const objectAtPoint = selectionSystem.findObjectAtPoint(canvasPoint, pathsRef.current, shapesRef.current, textsRef.current);
      if (objectAtPoint) {
        // Delete the object that was hovered over while dragging
        setPaths(prev => prev.filter(p => p.id !== objectAtPoint));
        setShapes(prev => prev.filter(s => s.id !== objectAtPoint));
        setTexts(prev => prev.filter(t => t.id !== objectAtPoint));
        setDebugInfo(`拖拽删除对象: ${objectAtPoint}`);
      }
    } else if (isDrawing && currentShape) {
      let endPoint = canvasPoint;
      
      // Apply Shift key constraint for squares and circles
      if (e.shiftKey && currentShape.startPoint) {
        const width = Math.abs(canvasPoint.x - currentShape.startPoint.x);
        const height = Math.abs(canvasPoint.y - currentShape.startPoint.y);
        const size = Math.min(width, height);
        
        endPoint = {
          x: currentShape.startPoint.x + (canvasPoint.x >= currentShape.startPoint.x ? size : -size),
          y: currentShape.startPoint.y + (canvasPoint.y >= currentShape.startPoint.y ? size : -size)
        };
      }
      
      setCurrentShape(prev => prev ? { ...prev, endPoint } : null);
    } else if (isDragging && dragStart && currentTool === "select") {
      if (resizeHandle && initialBounds && initialObjects && dragStart) {
        // Handle resizing
        const deltaX = canvasPoint.x - dragStart.x;
        const deltaY = canvasPoint.y - dragStart.y;
        
        const newBounds = { ...initialBounds };
        
        // Calculate new bounds based on handle
        switch (resizeHandle) {
          case 'top-left':
            newBounds.x += deltaX;
            newBounds.y += deltaY;
            newBounds.width -= deltaX;
            newBounds.height -= deltaY;
            break;
          case 'top-center':
            newBounds.y += deltaY;
            newBounds.height -= deltaY;
            break;
          case 'top-right':
            newBounds.y += deltaY;
            newBounds.width += deltaX;
            newBounds.height -= deltaY;
            break;
          case 'middle-left':
            newBounds.x += deltaX;
            newBounds.width -= deltaX;
            break;
          case 'middle-right':
            newBounds.width += deltaX;
            break;
          case 'bottom-left':
            newBounds.x += deltaX;
            newBounds.width -= deltaX;
            newBounds.height += deltaY;
            break;
          case 'bottom-center':
            newBounds.height += deltaY;
            break;
          case 'bottom-right':
            newBounds.width += deltaX;
            newBounds.height += deltaY;
            break;
        }
        
        // Apply Shift key constraint for proportional scaling
        if (e.shiftKey && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(resizeHandle)) {
          const aspectRatio = initialBounds.width / initialBounds.height;
          
          if (Math.abs(newBounds.width / newBounds.height - aspectRatio) > 0.1) {
            if (resizeHandle === 'bottom-right' || resizeHandle === 'top-left') {
              // Maintain aspect ratio based on width change
              const targetHeight = newBounds.width / aspectRatio;
              if (resizeHandle === 'top-left') {
                newBounds.y = initialBounds.y + initialBounds.height - targetHeight;
              }
              newBounds.height = targetHeight;
            } else if (resizeHandle === 'top-right' || resizeHandle === 'bottom-left') {
              // Maintain aspect ratio based on height change
              const targetWidth = newBounds.height * aspectRatio;
              if (resizeHandle === 'bottom-left') {
                newBounds.x = initialBounds.x + initialBounds.width - targetWidth;
              }
              newBounds.width = targetWidth;
            }
          }
        }
        
        // Apply scaling to selected objects
        if (newBounds.width > 10 && newBounds.height > 10) {
          const scaleX = newBounds.width / initialBounds.width;
          const scaleY = newBounds.height / initialBounds.height;
          
          // Scale shapes
          setShapes(prevShapes => 
            prevShapes.map(shape => {
              if (selectedObjects.includes(shape.id)) {
                const originalShape = initialObjects.shapes.find(s => s.id === shape.id);
                if (!originalShape) return shape;
                
                const relStartX = (originalShape.startPoint.x - initialBounds.x) / initialBounds.width;
                const relStartY = (originalShape.startPoint.y - initialBounds.y) / initialBounds.height;
                const relEndX = (originalShape.endPoint.x - initialBounds.x) / initialBounds.width;
                const relEndY = (originalShape.endPoint.y - initialBounds.y) / initialBounds.height;
                
                return {
                  ...shape,
                  startPoint: {
                    x: newBounds.x + relStartX * newBounds.width,
                    y: newBounds.y + relStartY * newBounds.height
                  },
                  endPoint: {
                    x: newBounds.x + relEndX * newBounds.width,
                    y: newBounds.y + relEndY * newBounds.height
                  }
                };
              }
              return shape;
            })
          );
          
          // Scale text positions
          setTexts(prevTexts => 
            prevTexts.map(text => {
              if (selectedObjects.includes(text.id)) {
                const originalText = initialObjects.texts.find(t => t.id === text.id);
                if (!originalText) return text;
                
                const relX = (originalText.position.x - initialBounds.x) / initialBounds.width;
                const relY = (originalText.position.y - initialBounds.y) / initialBounds.height;
                
                return {
                  ...text,
                  position: {
                    x: newBounds.x + relX * newBounds.width,
                    y: newBounds.y + relY * newBounds.height
                  },
                  fontSize: originalText.fontSize * Math.min(scaleX, scaleY)
                };
              }
              return text;
            })
          );
          
          // Scale paths
          setPaths(prevPaths => 
            prevPaths.map(path => {
              if (selectedObjects.includes(path.id)) {
                const originalPath = initialObjects.paths.find(p => p.id === path.id);
                if (!originalPath) return path;
                
                return {
                  ...path,
                  points: originalPath.points.map(point => {
                    const relX = (point.x - initialBounds.x) / initialBounds.width;
                    const relY = (point.y - initialBounds.y) / initialBounds.height;
                    
                    return {
                      x: newBounds.x + relX * newBounds.width,
                      y: newBounds.y + relY * newBounds.height
                    };
                  })
                };
              }
              return path;
            })
          );
        }
      } else {
        // Handle object dragging
        const deltaX = canvasPoint.x - dragStart.x;
        const deltaY = canvasPoint.y - dragStart.y;
        
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          // Move selected objects
          setPaths(prevPaths => 
            prevPaths.map(path => 
              selectedObjects.includes(path.id) 
                ? { ...path, points: path.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY })) }
                : path
            )
          );
          
          setShapes(prevShapes => 
            prevShapes.map(shape => 
              selectedObjects.includes(shape.id) 
                ? { 
                    ...shape, 
                    startPoint: { x: shape.startPoint.x + deltaX, y: shape.startPoint.y + deltaY },
                    endPoint: { x: shape.endPoint.x + deltaX, y: shape.endPoint.y + deltaY }
                  }
                : shape
            )
          );
          
          setTexts(prevTexts => 
            prevTexts.map(text => 
              selectedObjects.includes(text.id) 
                ? { ...text, position: { x: text.position.x + deltaX, y: text.position.y + deltaY } }
                : text
            )
          );
          
          setDragStart(canvasPoint);
        }
      }
    } else if (currentTool === "select") {
      // Handle marquee selection dragging
      if (marqueeSelection && marqueeSelection.isActive) {
        setMarqueeSelection(prev => prev ? {
          ...prev,
          endPoint: canvasPoint
        } : null);
      } else {
        const cursor = selectionSystem.getCursorForPoint(canvasPoint, pathsRef.current, shapesRef.current, textsRef.current, selectedObjects);
        setCursorStyle(cursor);
      }
    }
  }, [
    isDrawing, 
    currentTool, 
    currentShape, 
    viewport, 
    selectionSystem, 
    isDragging, 
    dragStart, 
    selectedObjects, 
    resizeHandle, 
    initialBounds, 
    initialObjects,
    marqueeSelection
  ]);

  const handleMouseUp = useCallback((e?: React.MouseEvent) => {
    // Handle marquee selection completion
    if (marqueeSelection && marqueeSelection.isActive && currentTool === "select") {
      const isAdditive = e ? (e.ctrlKey || e.metaKey) : false;
      
      // Only perform selection if marquee has meaningful size
      const marqueeWidth = Math.abs(marqueeSelection.endPoint.x - marqueeSelection.startPoint.x);
      const marqueeHeight = Math.abs(marqueeSelection.endPoint.y - marqueeSelection.startPoint.y);
      
      if (marqueeWidth > 5 || marqueeHeight > 5) {
        selectionSystem.selectByMarqueeWithCurrent(
          marqueeSelection.startPoint,
          marqueeSelection.endPoint,
          pathsRef.current,
          shapesRef.current,
          textsRef.current,
          selectedObjects,
          isAdditive
        );
        setDebugInfo(`框选完成: ${isAdditive ? '追加' : '替换'}模式`);
      }
      
      setMarqueeSelection(null);
    }
    
    if (isDrawing && currentTool === "pen" && currentPath.length > 1) {
      const newPath: DrawingPath = {
        id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points: currentPath,
        color: strokeColor,
        width: strokeWidth,
        zIndex: Math.max(0, ...paths.map(p => p.zIndex || 0)) + 1
      };

      const command = createAddPathCommand(newPath, paths, setPaths);
      commandSystem.executeCommand(command);
      setCurrentPath([]);
    } else if (isDrawing && currentShape && currentShape.startPoint && currentShape.endPoint) {
      const newShape: Shape = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: currentShape.type as "rectangle" | "circle",
        startPoint: currentShape.startPoint,
        endPoint: currentShape.endPoint,
        color: strokeColor,
        width: strokeWidth,
        fillColor: fillColor,
        zIndex: Math.max(0, ...shapes.map(s => s.zIndex || 0)) + 1
      };

      const command = createAddShapeCommand(newShape, shapes, setShapes);
      commandSystem.executeCommand(command);
      setCurrentShape(null);
    }

    setIsDrawing(false);
    setIsDragging(false);
    setDragStart(null);
    setResizeHandle(null);
    setInitialBounds(null);
    setInitialObjects(null);
  }, [isDrawing, currentTool, currentPath, currentShape, strokeColor, strokeWidth, fillColor, paths, shapes, commandSystem, marqueeSelection, selectionSystem, selectedObjects]);

  // Complete text input
  const completeTextInput = useCallback(() => {
    console.log('✅ 完成文本输入:', { editingText, textInput: textInput.trim() });
    if (editingText && textInput.trim()) {
      const newText: TextElement = {
        id: editingText.id,
        type: "text",
        position: editingText.position,
        content: textInput.trim(),
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textAlign,
        color: strokeColor,
        zIndex: Math.max(0, ...texts.map(t => t.zIndex || 0)) + 1
      };

      console.log('📝 创建新文本对象:', newText);
      const command = createAddTextCommand(newText, texts, setTexts);
      commandSystem.executeCommand(command);
      setDebugInfo(`文本已添加: "${newText.content}" 位置(${newText.position.x.toFixed(0)},${newText.position.y.toFixed(0)})`);
    } else {
      console.log('❌ 文本输入取消或为空');
      setDebugInfo('文本输入取消');
    }
    
    setEditingText(null);
    setTextInput("");
  }, [editingText, textInput, fontSize, fontFamily, fontWeight, fontStyle, textAlign, strokeColor, texts, commandSystem]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingText) {
        if (e.key === 'Enter') {
          e.preventDefault();
          completeTextInput();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEditingText(null);
          setTextInput("");
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          commandSystem.undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          commandSystem.redo();
        } else if (e.key === 'a') {
          e.preventDefault();
          selectionSystem.selectAll(paths, shapes, texts);
        } else if (e.key === 'c') {
          e.preventDefault();
          const copied = selectionSystem.copySelected(paths, shapes, texts, selectedObjects);
          setClipboard(copied);
        } else if (e.key === 'v') {
          e.preventDefault();
          if (clipboard.length > 0) {
            const newIds: string[] = [];
            
            clipboard.forEach(obj => {
              let objType = 'unknown';
              if ('points' in obj) objType = 'path';
              else if ('startPoint' in obj) objType = 'shape';
              else objType = 'text';
              
              const newId = `${objType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              newIds.push(newId);

              if ('points' in obj) {
                const newPath: DrawingPath = {
                  ...obj,
                  id: newId,
                  points: obj.points.map(p => ({ x: p.x + 20, y: p.y + 20 }))
                };
                setPaths(prev => [...prev, newPath]);
              } else if ('startPoint' in obj) {
                const newShape: Shape = {
                  ...obj,
                  id: newId,
                  startPoint: { x: obj.startPoint.x + 20, y: obj.startPoint.y + 20 },
                  endPoint: { x: obj.endPoint.x + 20, y: obj.endPoint.y + 20 }
                };
                setShapes(prev => [...prev, newShape]);
              } else {
                const newText: TextElement = {
                  ...obj,
                  id: newId,
                  position: { x: obj.position.x + 20, y: obj.position.y + 20 }
                };
                setTexts(prev => [...prev, newText]);
              }
            });
            
            setSelectedObjects(newIds);
          }
        } else if (e.key === 'd') {
          e.preventDefault();
          selectionSystem.duplicateSelected(paths, shapes, texts, setPaths, setShapes, setTexts, selectedObjects);
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        selectionSystem.deleteSelected(paths, shapes, texts, setPaths, setShapes, setTexts, selectedObjects);
      } else if (e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const toolMap: { [key: string]: ToolType } = {
          '1': 'select', '2': 'pen', '3': 'rectangle',
          '4': 'circle', '5': 'text', '6': 'eraser'
        };
        const newTool = toolMap[e.key];
        if (newTool) {
          setCurrentTool(newTool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingText, completeTextInput, commandSystem, selectionSystem, paths, shapes, texts, clipboard, selectedObjects]);

  // Zoom and pan handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, viewport.scale * scaleFactor));
      
      const newOffsetX = mouseX - (mouseX - viewport.offsetX) * (newScale / viewport.scale);
      const newOffsetY = mouseY - (mouseY - viewport.offsetY) * (newScale / viewport.scale);
      
      setViewport({
        offsetX: newOffsetX,
        offsetY: newOffsetY,
        scale: newScale
      });
    } else {
      // Pan
      setViewport(prev => ({
        ...prev,
        offsetX: prev.offsetX - e.deltaX,
        offsetY: prev.offsetY - e.deltaY
      }));
    }
  }, [viewport]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas);
    const engine = new DrawingEngine(ctx, viewport);
    setDrawingEngine(engine);
    redraw();
  }, [viewport, redraw]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-r border-gray-200 p-4 w-64 overflow-y-auto">
        <div className="space-y-4">
          {/* Tools */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">工具</h3>
            {currentTool === "select" && (
              <div className="text-xs text-gray-500 mb-2 p-2 bg-blue-50 rounded">
                💡 框选功能说明：
                <br/>• 拖拽空白区域进行框选
                <br/>• 按住 Ctrl/Cmd + 框选追加对象
                <br/>• 按住 Ctrl/Cmd + 点击多选单个对象
                <br/>
                <span className="text-xs text-gray-400">当前: {selectedObjects.length} 个对象已选中</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[
                { tool: "select" as ToolType, icon: MousePointer2, label: "选择 (1)" },
                { tool: "pen" as ToolType, icon: Pen, label: "画笔 (2)" },
                { tool: "rectangle" as ToolType, icon: Square, label: "矩形 (3)" },
                { tool: "circle" as ToolType, icon: Circle, label: "圆形 (4)" },
                { tool: "text" as ToolType, icon: Type, label: "文本 (5)" },
                { tool: "eraser" as ToolType, icon: Eraser, label: "橡皮 (6)" }
              ].map(({ tool, icon: Icon, label }) => (
                <Button
                  key={tool}
                  variant={currentTool === tool ? "default" : "outline"}
                  className="p-2 h-auto flex flex-col items-center gap-1"
                  onClick={() => setCurrentTool(tool)}
                  title={label}
                >
                  <Icon size={16} />
                  <span className="text-xs">{label.split(' ')[0]}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Stroke Colors */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">描边颜色</h3>
            <div className="grid grid-cols-4 gap-2">
              {colors.map(color => (
                <Button
                  key={color}
                  className="w-8 h-8 p-0 rounded border-2"
                  style={{ 
                    backgroundColor: color,
                    borderColor: strokeColor === color ? '#000' : '#ccc'
                  }}
                  onClick={() => setStrokeColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Fill Colors */}
          {(currentTool === "rectangle" || currentTool === "circle") && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">填充颜色</h3>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {colors.map(color => (
                  <Button
                    key={color}
                    className="w-8 h-8 p-0 rounded border-2"
                    style={{ 
                      backgroundColor: color,
                      borderColor: fillColor === color ? '#000' : '#ccc'
                    }}
                    onClick={() => setFillColor(color)}
                  />
                ))}
              </div>
              <Button
                className="w-full text-xs"
                variant={fillColor === "transparent" ? "default" : "outline"}
                onClick={() => setFillColor("transparent")}
              >
                无填充
              </Button>
            </div>
          )}

          {/* Stroke Width */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">线条宽度</h3>
            <input
              type="range"
              min={1}
              max={20}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{strokeWidth}px</div>
          </div>

          {/* Text Controls */}
          {currentTool === "text" && (
            <div className="space-y-4">
              {/* Font Size */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">字体大小</h3>
                <input
                  type="range"
                  min={8}
                  max={72}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{fontSize}px</div>
              </div>

              {/* Font Family */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">字体系列</h3>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Courier New, monospace">Courier New</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="微软雅黑, sans-serif">微软雅黑</option>
                  <option value="SimHei, sans-serif">黑体</option>
                </select>
              </div>

              {/* Font Style */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">字体样式</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={fontWeight === "bold" ? "default" : "outline"}
                    onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")}
                    className="flex-1"
                  >
                    <strong>B</strong>
                  </Button>
                  <Button
                    size="sm"
                    variant={fontStyle === "italic" ? "default" : "outline"}
                    onClick={() => setFontStyle(fontStyle === "italic" ? "normal" : "italic")}
                    className="flex-1"
                  >
                    <em>I</em>
                  </Button>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">文本对齐</h3>
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    size="sm"
                    variant={textAlign === "left" ? "default" : "outline"}
                    onClick={() => setTextAlign("left")}
                    className="text-xs"
                  >
                    左对齐
                  </Button>
                  <Button
                    size="sm"
                    variant={textAlign === "center" ? "default" : "outline"}
                    onClick={() => setTextAlign("center")}
                    className="text-xs"
                  >
                    居中
                  </Button>
                  <Button
                    size="sm"
                    variant={textAlign === "right" ? "default" : "outline"}
                    onClick={() => setTextAlign("right")}
                    className="text-xs"
                  >
                    右对齐
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Selection Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">选中对象调试</h3>
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded mb-2">
              <div>选中数量: {selectedObjects.length}</div>
              <div>选中ID: {selectedObjects.join(', ') || '无'}</div>
              <div>总对象: 路径{paths.length} + 形状{shapes.length} + 文本{texts.length}</div>
              <div>编辑文本: {editingText ? `${editingText.id} (${editingText.position.x.toFixed(0)},${editingText.position.y.toFixed(0)})` : '无'}</div>
              <div>文本输入: "{textInput}"</div>
              <div className="text-green-600">{debugInfo}</div>
            </div>
            <Button
              size="sm"
              className="mb-2"
              onClick={() => {
                // 收集所有对象ID
                const allIds = [
                  ...paths.map(p => p.id),
                  ...shapes.map(s => s.id),
                  ...texts.map(t => t.id)
                ];
                setSelectedObjects(allIds);
              }}
            >
              测试：全部高亮
            </Button>
            {selectedObjects.length > 0 && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => selectionSystem.bringToFront(paths, shapes, texts, setPaths, setShapes, setTexts, selectedObjects)}
                >
                  置顶
                </Button>
                <Button
                  size="sm"
                  onClick={() => selectionSystem.sendToBack(paths, shapes, texts, setPaths, setShapes, setTexts, selectedObjects)}
                >
                  置底
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: cursorStyle }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
        
        {/* Text Input Overlay */}
        {editingText && (
          <div 
            className="absolute bg-white border-2 border-blue-500 rounded p-2 z-50 shadow-lg"
            style={{
              left: Math.max(10, Math.min(window.innerWidth - 220, editingText.position.x * viewport.scale + viewport.offsetX)),
              top: Math.max(10, Math.min(window.innerHeight - 60, editingText.position.y * viewport.scale + viewport.offsetY)),
              minWidth: '200px',
              pointerEvents: 'auto' // 确保可以交互
            }}
            onMouseDown={(e) => e.stopPropagation()} // 防止点击输入框时触发画布事件
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onBlur={completeTextInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  completeTextInput();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setEditingText(null);
                  setTextInput("");
                }
              }}
              className="w-full px-2 py-1 border-none outline-none bg-transparent text-sm"
              placeholder="输入文本..."
              autoFocus
              ref={(input) => {
                if (input) {
                  // 确保输入框获得焦点
                  setTimeout(() => input.focus(), 10);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}