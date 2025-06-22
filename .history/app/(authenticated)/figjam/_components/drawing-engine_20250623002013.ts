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

  drawIndividualHighlight(bounds: { x: number; y: number; width: number; height: number }, objectId: string) {
    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    const padding = 2;
    const x = bounds.x - padding;
    const y = bounds.y - padding;
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    // 使用更明显的高亮样式，确保每个对象都可见
    this.ctx.strokeStyle = '#10b981'; // 绿色高亮，更容易看到多个对象
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.9;

    // 绘制实线边框，更清楚
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(x, y, width, height);

    // 添加半透明背景色
    this.ctx.fillStyle = '#10b981';
    this.ctx.globalAlpha = 0.15;
    this.ctx.fillRect(x, y, width, height);

    console.log('✨ Drew individual highlight for:', objectId, 'at bounds:', bounds);
    this.ctx.restore();
  }

  drawSelectionBox(bounds: { x: number; y: number; width: number; height: number }) {
    this.ctx.save();
    this.ctx.transform(1, 0, 0, 1, this.viewport.offsetX, this.viewport.offsetY);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);

    // Draw modern selection box with clean lines
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 1;
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(bounds.x - 1, bounds.y - 1, bounds.width + 2, bounds.height + 2);

    // Draw selection handles with improved design
    const handles = getSelectionHandles(bounds);

    Object.entries(handles).forEach(([handleName, handlePos]) => {
      const handleSize = handleName === 'rotation' ? 7 : 9;

      // Handle shadow effect
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;

      // Handle background (white with border)
      this.ctx.fillStyle = '#ffffff';
      this.ctx.strokeStyle = '#3b82f6';
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      this.ctx.arc(handlePos.x, handlePos.y, handleSize / 2, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      // Draw rotation handle line with better styling
      if (handleName === 'rotation') {
        this.ctx.save();
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([2, 2]);
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
        this.ctx.lineTo(handlePos.x, handlePos.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
      }
    });

    console.log('💻 Drew selection box at bounds:', bounds);
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

    // Draw selection highlighting - both individual and combined
    if (selectedObjects.length > 0) {
      console.log('🎨 Drawing selection for:', selectedObjects);

      const selectedObjs = [
        ...paths.filter(p => selectedObjects.includes(p.id)),
        ...shapes.filter(s => selectedObjects.includes(s.id)),
        ...texts.filter(t => selectedObjects.includes(t.id))
      ];

      console.log('🎨 Found selected objects:', selectedObjs.map(obj => obj.id));

      if (selectedObjs.length > 0) {
        // 先画 selection box
        if (selectedObjs.length > 1) {
          const bounds = selectedObjs.map(obj => getBounds(obj));

          const minX = Math.min(...bounds.map(b => b.x));
          const minY = Math.min(...bounds.map(b => b.y));
          const maxX = Math.max(...bounds.map(b => b.x + b.width));
          const maxY = Math.max(...bounds.map(b => b.y + b.height));

          const selectionBounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          };

          this.drawSelectionBox(selectionBounds);
        } else {
          // 单选时画 handles
          const bounds = getBounds(selectedObjs[0]);
          this.drawSelectionBox(bounds);
        }
        // 再画每个对象的高亮
        selectedObjs.forEach(obj => {
          const bounds = getBounds(obj);
          this.drawIndividualHighlight(bounds, obj.id);
        });
      }
    }

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