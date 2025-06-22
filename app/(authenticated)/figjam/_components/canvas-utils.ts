import { Point, DrawingPath, Shape, TextElement, Viewport } from './types';

// Canvas coordinate conversion utilities
export const screenToCanvas = (screenPoint: Point, viewport: Viewport): Point => ({
  x: (screenPoint.x - viewport.offsetX) / viewport.scale,
  y: (screenPoint.y - viewport.offsetY) / viewport.scale
});

export const canvasToScreen = (canvasPoint: Point, viewport: Viewport): Point => ({
  x: canvasPoint.x * viewport.scale + viewport.offsetX,
  y: canvasPoint.y * viewport.scale + viewport.offsetY
});

// Bounding box calculations
export const getBounds = (obj: DrawingPath | Shape | TextElement): { x: number; y: number; width: number; height: number } => {
  if ('points' in obj) {
    // DrawingPath
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
  } else if ('startPoint' in obj) {
    // Shape
    const minX = Math.min(obj.startPoint.x, obj.endPoint.x);
    const maxX = Math.max(obj.startPoint.x, obj.endPoint.x);
    const minY = Math.min(obj.startPoint.y, obj.endPoint.y);
    const maxY = Math.max(obj.startPoint.y, obj.endPoint.y);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } else {
    // TextElement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${obj.fontStyle} ${obj.fontWeight} ${obj.fontSize}px ${obj.fontFamily}`;
    const metrics = ctx.measureText(obj.content);
    
    return {
      x: obj.position.x,
      y: obj.position.y - obj.fontSize,
      width: metrics.width,
      height: obj.fontSize
    };
  }
};

// Hit testing
export const isPointInPath = (point: Point, path: DrawingPath): boolean => {
  const bounds = getBounds(path);
  const expandedBounds = {
    x: bounds.x - 5,
    y: bounds.y - 5,
    width: bounds.width + 10,
    height: bounds.height + 10
  };
  
  return point.x >= expandedBounds.x &&
         point.x <= expandedBounds.x + expandedBounds.width &&
         point.y >= expandedBounds.y &&
         point.y <= expandedBounds.y + expandedBounds.height;
};

export const isPointInShape = (point: Point, shape: Shape): boolean => {
  const bounds = getBounds(shape);
  return point.x >= bounds.x &&
         point.x <= bounds.x + bounds.width &&
         point.y >= bounds.y &&
         point.y <= bounds.y + bounds.height;
};

export const isPointInText = (point: Point, text: TextElement): boolean => {
  const bounds = getBounds(text);
  return point.x >= bounds.x &&
         point.x <= bounds.x + bounds.width &&
         point.y >= bounds.y &&
         point.y <= bounds.y + bounds.height;
};

// Selection handle utilities
export const getSelectionHandles = (bounds: { x: number; y: number; width: number; height: number }) => {
  const handles = {
    'top-left': { x: bounds.x, y: bounds.y },
    'top-center': { x: bounds.x + bounds.width / 2, y: bounds.y },
    'top-right': { x: bounds.x + bounds.width, y: bounds.y },
    'middle-left': { x: bounds.x, y: bounds.y + bounds.height / 2 },
    'middle-right': { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    'bottom-left': { x: bounds.x, y: bounds.y + bounds.height },
    'bottom-center': { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    'bottom-right': { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    'rotation': { x: bounds.x + bounds.width / 2, y: bounds.y - 30 }
  };
  return handles;
};

export const getHandleAtPoint = (point: Point, bounds: { x: number; y: number; width: number; height: number }): string | null => {
  const handles = getSelectionHandles(bounds);
  const handleSize = 8;
  
  for (const [handleName, handlePos] of Object.entries(handles)) {
    if (point.x >= handlePos.x - handleSize / 2 &&
        point.x <= handlePos.x + handleSize / 2 &&
        point.y >= handlePos.y - handleSize / 2 &&
        point.y <= handlePos.y + handleSize / 2) {
      return handleName;
    }
  }
  return null;
};

export const getCursorForHandle = (handle: string): string => {
  const cursorMap: { [key: string]: string } = {
    'top-left': 'nw-resize',
    'top-center': 'n-resize',
    'top-right': 'ne-resize',
    'middle-left': 'w-resize',
    'middle-right': 'e-resize',
    'bottom-left': 'sw-resize',
    'bottom-center': 's-resize',
    'bottom-right': 'se-resize',
    'rotation': 'grab'
  };
  return cursorMap[handle] || 'default';
};

// Object layering utilities
export const getMaxZIndex = (objects: (DrawingPath | Shape | TextElement)[]): number => {
  return Math.max(0, ...objects.map(obj => obj.zIndex || 0));
};

export const getMinZIndex = (objects: (DrawingPath | Shape | TextElement)[]): number => {
  return Math.min(0, ...objects.map(obj => obj.zIndex || 0));
};

// Canvas setup utilities
export const setupCanvas = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  
  return ctx;
};

// Grid drawing
export const drawGrid = (ctx: CanvasRenderingContext2D, viewport: Viewport, canvasWidth: number, canvasHeight: number) => {
  const gridSize = 20;
  const scaledGridSize = gridSize * viewport.scale;
  
  if (scaledGridSize < 5) return; // Don't draw grid if too small
  
  ctx.save();
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.5;
  
  const startX = -viewport.offsetX % scaledGridSize;
  const startY = -viewport.offsetY % scaledGridSize;
  
  // Vertical lines
  for (let x = startX; x < canvasWidth; x += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = startY; y < canvasHeight; y += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
  
  ctx.restore();
};