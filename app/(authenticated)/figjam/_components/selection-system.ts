import { Point, DrawingPath, Shape, TextElement } from './types';
import {
  isPointInPath,
  isPointInShape,
  isPointInText,
  getBounds,
  getHandleAtPoint,
  getCursorForHandle
} from './canvas-utils';

export class SelectionSystem {
  private onSelectionChange: (selectedIds: string[]) => void;

  constructor(onSelectionChange: (selectedIds: string[]) => void) {
    this.onSelectionChange = onSelectionChange;
  }

  addToSelection(objectId: string, selectedObjects: string[]) {
    const id = String(objectId).trim();
    if (!selectedObjects.includes(id)) {
      this.onSelectionChange([...selectedObjects, id]);
    }
  }

  removeFromSelection(objectId: string, selectedObjects: string[]) {
    const id = String(objectId).trim();
    this.onSelectionChange(selectedObjects.filter(i => i !== id));
  }

  clearSelection() {
    this.onSelectionChange([]);
  }

  selectSingle(objectId: string) {
    const id = String(objectId).trim();
    this.onSelectionChange([id]);
  }

  isSelected(objectId: string, selectedObjects: string[]): boolean {
    const id = String(objectId).trim();
    return selectedObjects.includes(id);
  }

  selectAll(paths: DrawingPath[], shapes: Shape[], texts: TextElement[]) {
    const allIds = [
      ...paths.map(p => String(p.id).trim()),
      ...shapes.map(s => String(s.id).trim()),
      ...texts.map(t => String(t.id).trim())
    ];
    this.onSelectionChange(allIds);
  }

  findObjectAtPoint(
    point: Point,
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[]
  ): string | null {
    const allObjects = [
      ...paths.map(p => ({ ...p, objectType: 'path' as const })),
      ...shapes.map(s => ({ ...s, objectType: 'shape' as const })),
      ...texts.map(t => ({ ...t, objectType: 'text' as const }))
    ].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    for (const obj of allObjects) {
      let isHit = false;
      if (obj.objectType === 'path') {
        isHit = isPointInPath(point, obj as DrawingPath);
      } else if (obj.objectType === 'shape') {
        isHit = isPointInShape(point, obj as Shape);
      } else if (obj.objectType === 'text') {
        isHit = isPointInText(point, obj as TextElement);
      }
      if (isHit) {
        return String(obj.id).trim();
      }
    }
    return null;
  }

  handleClick(
    point: Point,
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    selectedObjects: string[],
    isMultiSelectPressed: boolean = false
  ): string | null {
    const clickedObjectId = this.findObjectAtPoint(point, paths, shapes, texts);
    if (clickedObjectId) {
      if (isMultiSelectPressed) {
        if (this.isSelected(clickedObjectId, selectedObjects)) {
          this.removeFromSelection(clickedObjectId, selectedObjects);
        } else {
          this.addToSelection(clickedObjectId, selectedObjects);
        }
      } else {
        this.onSelectionChange([clickedObjectId]);
      }
      return clickedObjectId;
    } else if (!isMultiSelectPressed) {
      this.clearSelection();
    }
    return null;
  }

  getSelectionBounds(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    selectedObjects: string[]
  ): { x: number; y: number; width: number; height: number } | null {
    if (selectedObjects.length === 0) return null;
    const selectedIdSet = new Set(selectedObjects.map(id => String(id).trim()));
    const selectedObjs = [
      ...paths.filter(p => selectedIdSet.has(String(p.id).trim())),
      ...shapes.filter(s => selectedIdSet.has(String(s.id).trim())),
      ...texts.filter(t => selectedIdSet.has(String(t.id).trim()))
    ];
    if (selectedObjs.length === 0) return null;
    const bounds = selectedObjs.map(obj => getBounds(obj));
    const minX = Math.min(...bounds.map(b => b.x));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxX = Math.max(...bounds.map(b => b.x + b.width));
    const maxY = Math.max(...bounds.map(b => b.y + b.height));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  getHandleAtPoint(
    point: Point,
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    selectedObjects: string[]
  ): string | null {
    const selectionBounds = this.getSelectionBounds(paths, shapes, texts, selectedObjects);
    if (!selectionBounds) return null;
    return getHandleAtPoint(point, selectionBounds);
  }

  getCursorForPoint(
    point: Point,
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    selectedObjects: string[]
  ): string {
    const handle = this.getHandleAtPoint(point, paths, shapes, texts, selectedObjects);
    if (handle) {
      return getCursorForHandle(handle);
    }
    const selectedIdSet = new Set(selectedObjects.map(id => String(id).trim()));
    const selectedObjs = [
      ...paths.filter(p => selectedIdSet.has(String(p.id).trim())),
      ...shapes.filter(s => selectedIdSet.has(String(s.id).trim())),
      ...texts.filter(t => selectedIdSet.has(String(t.id).trim()))
    ];
    for (const obj of selectedObjs) {
      let isHit = false;
      if ('points' in obj) {
        isHit = isPointInPath(point, obj as DrawingPath);
      } else if ('startPoint' in obj) {
        isHit = isPointInShape(point, obj as Shape);
      } else {
        isHit = isPointInText(point, obj as TextElement);
      }
      if (isHit) {
        return 'move';
      }
    }
    const clickedObjectId = this.findObjectAtPoint(point, paths, shapes, texts);
    if (clickedObjectId) {
      return 'pointer';
    }
    return 'default';
  }

  deleteSelected(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    setPaths: (paths: DrawingPath[]) => void,
    setShapes: (shapes: Shape[]) => void,
    setTexts: (texts: TextElement[]) => void,
    selectedObjects: string[]
  ) {
    if (selectedObjects.length === 0) return;
    setPaths(paths.filter(p => !selectedObjects.includes(p.id)));
    setShapes(shapes.filter(s => !selectedObjects.includes(s.id)));
    setTexts(texts.filter(t => !selectedObjects.includes(t.id)));
    this.clearSelection();
  }

  copySelected(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    selectedObjects: string[]
  ): (DrawingPath | Shape | TextElement)[] {
    const selectedObjs = [
      ...paths.filter(p => selectedObjects.includes(p.id)),
      ...shapes.filter(s => selectedObjects.includes(s.id)),
      ...texts.filter(t => selectedObjects.includes(t.id))
    ];
    return selectedObjs.map(obj => ({ ...obj }));
  }

  duplicateSelected(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    setPaths: (paths: DrawingPath[]) => void,
    setShapes: (shapes: Shape[]) => void,
    setTexts: (texts: TextElement[]) => void,
    selectedObjects: string[],
    offset: Point = { x: 20, y: 20 }
  ) {
    const selectedObjs = this.copySelected(paths, shapes, texts, selectedObjects);
    const newIds: string[] = [];
    selectedObjs.forEach(obj => {
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
          points: obj.points.map(p => ({ x: p.x + offset.x, y: p.y + offset.y }))
        };
        setPaths([...paths, newPath]);
      } else if ('startPoint' in obj) {
        const newShape: Shape = {
          ...obj,
          id: newId,
          startPoint: { x: obj.startPoint.x + offset.x, y: obj.startPoint.y + offset.y },
          endPoint: { x: obj.endPoint.x + offset.x, y: obj.endPoint.y + offset.y }
        };
        setShapes([...shapes, newShape]);
      } else {
        const newText: TextElement = {
          ...obj,
          id: newId,
          position: { x: obj.position.x + offset.x, y: obj.position.y + offset.y }
        };
        setTexts([...texts, newText]);
      }
    });
    this.onSelectionChange(newIds);
  }

  bringToFront(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    setPaths: (paths: DrawingPath[]) => void,
    setShapes: (shapes: Shape[]) => void,
    setTexts: (texts: TextElement[]) => void,
    selectedObjects: string[]
  ) {
    if (selectedObjects.length === 0) return;
    const allObjects = [...paths, ...shapes, ...texts];
    const maxZ = Math.max(0, ...allObjects.map(obj => obj.zIndex || 0));
    setPaths(paths.map(p => selectedObjects.includes(p.id) ? { ...p, zIndex: maxZ + 1 } : p));
    setShapes(shapes.map(s => selectedObjects.includes(s.id) ? { ...s, zIndex: maxZ + 1 } : s));
    setTexts(texts.map(t => selectedObjects.includes(t.id) ? { ...t, zIndex: maxZ + 1 } : t));
  }

  sendToBack(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    setPaths: (paths: DrawingPath[]) => void,
    setShapes: (shapes: Shape[]) => void,
    setTexts: (texts: TextElement[]) => void,
    selectedObjects: string[]
  ) {
    if (selectedObjects.length === 0) return;
    const allObjects = [...paths, ...shapes, ...texts];
    const minZ = Math.min(0, ...allObjects.map(obj => obj.zIndex || 0));
    setPaths(paths.map(p => selectedObjects.includes(p.id) ? { ...p, zIndex: minZ - 1 } : p));
    setShapes(shapes.map(s => selectedObjects.includes(s.id) ? { ...s, zIndex: minZ - 1 } : s));
    setTexts(texts.map(t => selectedObjects.includes(t.id) ? { ...t, zIndex: minZ - 1 } : t));
  }
}