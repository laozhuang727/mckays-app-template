import { DrawingPath, Shape, TextElement, Viewport, Point } from './types';
import { drawGrid, getBounds, getSelectionHandles } from './canvas-utils';

export class DrawingEngine {
  private ctx: CanvasRenderingContext2D;
  private viewport: Viewport;

  constructor(ctx: CanvasRenderingContext2D, viewport: Viewport) {
    this.ctx = ctx;
    this.viewport = viewport;
  }

  updateViewport(viewport: Viewport) {
    this.viewport = viewport;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  drawGrid(canvasWidth: number, canvasHeight: number) {
    drawGrid(this.ctx, this.viewport, canvasWidth, canvasHeight);
  }

  drawPath(path: DrawingPath) {
    if (path.points.length < 2) return;

    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    if (path.rotation) {
      const bounds = getBounds(path);
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((path.rotation * Math.PI) / 180);
      this.ctx.translate(-centerX, -centerY);
    }

    this.ctx.strokeStyle = path.color;
    this.ctx.lineWidth = path.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(path.points[0].x, path.points[0].y);
    
    for (let i = 1; i < path.points.length; i++) {
      this.ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawShape(shape: Shape) {
    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    if (shape.rotation) {
      const bounds = getBounds(shape);
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((shape.rotation * Math.PI) / 180);
      this.ctx.translate(-centerX, -centerY);
    }

    const x = Math.min(shape.startPoint.x, shape.endPoint.x);
    const y = Math.min(shape.startPoint.y, shape.endPoint.y);
    const width = Math.abs(shape.endPoint.x - shape.startPoint.x);
    const height = Math.abs(shape.endPoint.y - shape.startPoint.y);

    this.ctx.lineWidth = shape.width;
    this.ctx.strokeStyle = shape.color;

    if (shape.fillColor && shape.fillColor !== 'transparent') {
      this.ctx.fillStyle = shape.fillColor;
    }

    this.ctx.beginPath();
    
    if (shape.type === 'rectangle') {
      this.ctx.rect(x, y, width, height);
    } else if (shape.type === 'circle') {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.min(width, height) / 2;
      this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    }

    if (shape.fillColor && shape.fillColor !== 'transparent') {
      this.ctx.fill();
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawText(text: TextElement) {
    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    if (text.rotation) {
      this.ctx.translate(text.position.x, text.position.y);
      this.ctx.rotate((text.rotation * Math.PI) / 180);
      this.ctx.translate(-text.position.x, -text.position.y);
    }

    this.ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
    this.ctx.fillStyle = text.color;
    this.ctx.textBaseline = 'top';

    const textMetrics = this.ctx.measureText(text.content);
    let xPos = text.position.x;
    
    if (text.textAlign === 'center') {
      xPos = text.position.x - textMetrics.width / 2;
    } else if (text.textAlign === 'right') {
      xPos = text.position.x - textMetrics.width;
    }

    this.ctx.fillText(text.content, xPos, text.position.y);
    this.ctx.restore();
  }

  drawPreviewShape(shape: Partial<Shape>) {
    if (!shape.startPoint || !shape.endPoint || !shape.type) return;

    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    const x = Math.min(shape.startPoint.x, shape.endPoint.x);
    const y = Math.min(shape.startPoint.y, shape.endPoint.y);
    const width = Math.abs(shape.endPoint.x - shape.startPoint.x);
    const height = Math.abs(shape.endPoint.y - shape.startPoint.y);

    this.ctx.strokeStyle = shape.color || '#000000';
    this.ctx.lineWidth = shape.width || 2;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    
    if (shape.type === 'rectangle') {
      this.ctx.rect(x, y, width, height);
    } else if (shape.type === 'circle') {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.min(width, height) / 2;
      this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    }

    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  drawCurrentPath(points: Point[], color: string, width: number) {
    if (points.length < 2) return;

    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSelectionBox(bounds: { x: number; y: number; width: number; height: number }) {
    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    // Draw selection box
    this.ctx.strokeStyle = '#007bff';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.ctx.setLineDash([]);

    // Draw selection handles
    const handles = getSelectionHandles(bounds);
    this.ctx.fillStyle = '#007bff';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;

    Object.entries(handles).forEach(([handleName, handlePos]) => {
      const handleSize = handleName === 'rotation' ? 6 : 8;
      
      this.ctx.beginPath();
      this.ctx.arc(handlePos.x, handlePos.y, handleSize / 2, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw rotation handle line
      if (handleName === 'rotation') {
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
        this.ctx.lineTo(handlePos.x, handlePos.y);
        this.ctx.strokeStyle = '#007bff';
        this.ctx.stroke();
      }
    });

    this.ctx.restore();
  }

  drawTextEditor(position: Point, content: string, fontSize: number, fontFamily: string, fontWeight: string, fontStyle: string) {
    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    // Draw text background
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const textMetrics = this.ctx.measureText(content || '|');
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillRect(
      position.x - 2,
      position.y - 2,
      textMetrics.width + 4,
      fontSize + 4
    );

    // Draw border
    this.ctx.strokeStyle = '#007bff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      position.x - 2,
      position.y - 2,
      textMetrics.width + 4,
      fontSize + 4
    );

    // Draw text
    this.ctx.fillStyle = '#000000';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(content || '|', position.x, position.y);

    this.ctx.restore();
  }

  renderAll(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    selectedObjects: string[],
    currentPath: Point[],
    currentShape: Partial<Shape> | null,
    editingText: { id: string; position: Point } | null,
    textInput: string,
    strokeColor: string,
    strokeWidth: number,
    fontSize: number,
    fontFamily: string,
    fontWeight: string,
    fontStyle: string,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.clear();
    this.drawGrid(canvasWidth, canvasHeight);

    // Sort all objects by zIndex for proper layering
    const allObjects = [
      ...paths.map(p => ({ ...p, objectType: 'path' as const })),
      ...shapes.map(s => ({ ...s, objectType: 'shape' as const })),
      ...texts.map(t => ({ ...t, objectType: 'text' as const }))
    ].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Draw all objects
    allObjects.forEach(obj => {
      if (obj.objectType === 'path') {
        this.drawPath(obj as DrawingPath);
      } else if (obj.objectType === 'shape') {
        this.drawShape(obj as Shape);
      } else if (obj.objectType === 'text') {
        this.drawText(obj as TextElement);
      }
    });

    // Draw current path being drawn
    if (currentPath.length > 0) {
      this.drawCurrentPath(currentPath, strokeColor, strokeWidth);
    }

    // Draw current shape preview
    if (currentShape) {
      this.drawPreviewShape(currentShape);
    }

    // Draw selection boxes
    selectedObjects.forEach(id => {
      const obj = [...paths, ...shapes, ...texts].find(o => o.id === id);
      if (obj) {
        const bounds = getBounds(obj);
        this.drawSelectionBox(bounds);
      }
    });

    // Draw text editor
    if (editingText) {
      this.drawTextEditor(
        editingText.position,
        textInput,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle
      );
    }
  }
}