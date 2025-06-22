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

    const actualWidth = maxX - minX;
    const actualHeight = maxY - minY;

    let width = actualWidth;
    let height = actualHeight;
    let x = minX;
    let y = minY;

    // 对于圆形，确保bounds与实际绘制区域一致
    if (obj.type === 'circle') {
      const x0 = obj.startPoint.x;
      const y0 = obj.startPoint.y;
      const x1 = obj.endPoint.x;
      const y1 = obj.endPoint.y;
      const width = Math.abs(x1 - x0);
      const height = Math.abs(y1 - y0);
      const diameter = Math.min(width, height);
      const centerX = Math.min(x0, x1) + width / 2;
      const centerY = Math.min(y0, y1) + height / 2;
      x = centerX - diameter / 2;
      y = centerY - diameter / 2;
      width = diameter;
      height = diameter;
    }

    console.log('📏 Shape bounds calculation:', {
      shapeId: obj.id,
      shapeType: obj.type,
      startPoint: obj.startPoint,
      endPoint: obj.endPoint,
      actualSize: { width: actualWidth, height: actualHeight },
      finalBounds: { x, y, width, height }
    });

    return {
      x: x,
      y: y,
      width: width,
      height: height
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

// 专门用于碰撞检测的bounds计算，包含最小尺寸
const getHitTestBounds = (shape: Shape): { x: number; y: number; width: number; height: number } => {
  const minX = Math.min(shape.startPoint.x, shape.endPoint.x);
  const maxX = Math.max(shape.startPoint.x, shape.endPoint.x);
  const minY = Math.min(shape.startPoint.y, shape.endPoint.y);
  const maxY = Math.max(shape.startPoint.y, shape.endPoint.y);

  const actualWidth = maxX - minX;
  const actualHeight = maxY - minY;

  // 为碰撞检测确保最小尺寸
  const width = Math.max(actualWidth, 10);
  const height = Math.max(actualHeight, 10);

  return {
    x: minX,
    y: minY,
    width: width,
    height: height
  };
};

export const isPointInShape = (point: Point, shape: Shape): boolean => {
  const bounds = getBounds(shape);
  const hitBounds = getHitTestBounds(shape);

  console.log('🔍 isPointInShape Debug:', {
    shapeId: shape.id,
    shapeType: shape.type,
    startPoint: shape.startPoint,
    endPoint: shape.endPoint,
    visualBounds: bounds,
    hitBounds: hitBounds,
    clickPoint: point,
    boundsCheck: {
      xInRange: point.x >= hitBounds.x && point.x <= hitBounds.x + hitBounds.width,
      yInRange: point.y >= hitBounds.y && point.y <= hitBounds.y + hitBounds.height
    }
  });

  if (shape.type === 'rectangle') {
    const result = point.x >= hitBounds.x &&
      point.x <= hitBounds.x + hitBounds.width &&
      point.y >= hitBounds.y &&
      point.y <= hitBounds.y + hitBounds.height;
    console.log('🟨 Rectangle hit test result:', result);
    return result;
  } else if (shape.type === 'circle') {
    // 对于圆形，使用实际的视觉bounds来计算圆心和半径
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2;
    const distance = Math.sqrt(
      Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
    );
    // 但允许一些容错范围来改善用户体验
    const tolerance = Math.max(5, Math.min(hitBounds.width, hitBounds.height) / 4);
    const result = distance <= radius + tolerance;
    console.log('🟦 Circle hit test result:', result, { centerX, centerY, radius, distance, tolerance, bounds });
    return result;
  }

  return false;
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