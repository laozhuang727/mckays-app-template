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
  private selectedObjects: string[] = [];
  private onSelectionChange: (selectedIds: string[]) => void;

  constructor(onSelectionChange: (selectedIds: string[]) => void) {
    this.onSelectionChange = onSelectionChange;
  }

  getSelectedObjects(): string[] {
    return [...this.selectedObjects];
  }

  setSelectedObjects(objectIds: string[]) {
    console.log('🔄 setSelectedObjects called with:', objectIds);
    console.log('🔄 Previous selection:', this.selectedObjects);
    this.selectedObjects = [...objectIds];
    console.log('🔄 New selection after update:', this.selectedObjects);
    this.onSelectionChange(this.selectedObjects);
  }

  addToSelection(objectId: string) {
    console.log('➕ addToSelection called with:', objectId);
    console.log('➕ Current selection before add:', this.selectedObjects);
    if (!this.selectedObjects.includes(objectId)) {
      this.selectedObjects.push(objectId);
      console.log('➕ Selection after push:', this.selectedObjects);
      this.onSelectionChange(this.selectedObjects);
      console.log('➕ After callback, selection is:', this.selectedObjects);
    } else {
      console.log('➕ Object already selected, skipping');
    }
  }

  removeFromSelection(objectId: string) {
    console.log('➖ removeFromSelection called with:', objectId);
    console.log('➖ Current selection before remove:', this.selectedObjects);
    this.selectedObjects = this.selectedObjects.filter(id => id !== objectId);
    console.log('➖ Selection after filter:', this.selectedObjects);
    this.onSelectionChange(this.selectedObjects);
  }

  clearSelection() {
    this.selectedObjects = [];
    this.onSelectionChange(this.selectedObjects);
  }

  isSelected(objectId: string): boolean {
    return this.selectedObjects.includes(objectId);
  }

  selectAll(paths: DrawingPath[], shapes: Shape[], texts: TextElement[]) {
    const allIds = [
      ...paths.map(p => p.id),
      ...shapes.map(s => s.id),
      ...texts.map(t => t.id)
    ];
    this.setSelectedObjects(allIds);
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

    console.log('🎯 findObjectAtPoint called with:', {
      point,
      totalObjects: allObjects.length,
      pathCount: paths.length,
      shapeCount: shapes.length,
      textCount: texts.length,
      allObjectIds: allObjects.map(obj => obj.id)
    });

    for (const obj of allObjects) {
      let isHit = false;
      
      if (obj.objectType === 'path') {
        isHit = isPointInPath(point, obj as DrawingPath);
      } else if (obj.objectType === 'shape') {
        isHit = isPointInShape(point, obj as Shape);
        console.log('🔵 Shape hit test for', obj.id, ':', isHit);
      } else if (obj.objectType === 'text') {
        isHit = isPointInText(point, obj as TextElement);
      }
      
      if (isHit) {
        console.log('✅ Hit detected for object:', obj.id, 'type:', obj.objectType);
        return obj.id;
      }
    }

    console.log('❌ No objects hit at point:', point);
    return null;
  }

  handleClick(
    point: Point,
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    isMultiSelectPressed: boolean = false
  ): string | null {
    const clickedObjectId = this.findObjectAtPoint(point, paths, shapes, texts);
    
    console.log('🎯 Selection Debug:', {
      clickedObjectId,
      isMultiSelectPressed,
      currentSelection: this.selectedObjects,
      isAlreadySelected: clickedObjectId ? this.isSelected(clickedObjectId) : false
    });

    if (clickedObjectId) {
      if (isMultiSelectPressed) {
        // Toggle selection
        if (this.isSelected(clickedObjectId)) {
          console.log('➖ Removing from selection:', clickedObjectId);
          this.removeFromSelection(clickedObjectId);
        } else {
          console.log('➕ Adding to selection:', clickedObjectId);
          this.addToSelection(clickedObjectId);
        }
      } else {
        // Single selection
        console.log('🎯 Single selection:', clickedObjectId);
        this.setSelectedObjects([clickedObjectId]);
      }
      console.log('📝 Final selection:', this.selectedObjects);
      return clickedObjectId;
    } else if (!isMultiSelectPressed) {
      // Clicked on empty space, clear selection
      console.log('🧹 Clearing selection');
      this.clearSelection();
    }

    return null;
  }

  getSelectionBounds(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[]
  ): { x: number; y: number; width: number; height: number } | null {
    if (this.selectedObjects.length === 0) return null;

    const selectedObjs = [
      ...paths.filter(p => this.selectedObjects.includes(p.id)),
      ...shapes.filter(s => this.selectedObjects.includes(s.id)),
      ...texts.filter(t => this.selectedObjects.includes(t.id))
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
    texts: TextElement[]
  ): string | null {
    const selectionBounds = this.getSelectionBounds(paths, shapes, texts);
    if (!selectionBounds) return null;

    return getHandleAtPoint(point, selectionBounds);
  }

  getCursorForPoint(
    point: Point,
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[]
  ): string {
    // Check if point is on a resize handle
    const handle = this.getHandleAtPoint(point, paths, shapes, texts);
    if (handle) {
      return getCursorForHandle(handle);
    }

    // Check if point is on a selected object
    const selectedObjs = [
      ...paths.filter(p => this.selectedObjects.includes(p.id)),
      ...shapes.filter(s => this.selectedObjects.includes(s.id)),
      ...texts.filter(t => this.selectedObjects.includes(t.id))
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

    // Check if point is on any object
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
    setTexts: (texts: TextElement[]) => void
  ) {
    if (this.selectedObjects.length === 0) return;

    setPaths(paths.filter(p => !this.selectedObjects.includes(p.id)));
    setShapes(shapes.filter(s => !this.selectedObjects.includes(s.id)));
    setTexts(texts.filter(t => !this.selectedObjects.includes(t.id)));
    
    this.clearSelection();
  }

  copySelected(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[]
  ): (DrawingPath | Shape | TextElement)[] {
    const selectedObjs = [
      ...paths.filter(p => this.selectedObjects.includes(p.id)),
      ...shapes.filter(s => this.selectedObjects.includes(s.id)),
      ...texts.filter(t => this.selectedObjects.includes(t.id))
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
    offset: Point = { x: 20, y: 20 }
  ) {
    const selectedObjs = this.copySelected(paths, shapes, texts);
    const newIds: string[] = [];

    selectedObjs.forEach(obj => {
      let objType = 'unknown';
      if ('points' in obj) objType = 'path';
      else if ('startPoint' in obj) objType = 'shape';
      else objType = 'text';
      
      const newId = `${objType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newIds.push(newId);

      if ('points' in obj) {
        // DrawingPath
        const newPath: DrawingPath = {
          ...obj,
          id: newId,
          points: obj.points.map(p => ({ x: p.x + offset.x, y: p.y + offset.y }))
        };
        setPaths([...paths, newPath]);
      } else if ('startPoint' in obj) {
        // Shape
        const newShape: Shape = {
          ...obj,
          id: newId,
          startPoint: { x: obj.startPoint.x + offset.x, y: obj.startPoint.y + offset.y },
          endPoint: { x: obj.endPoint.x + offset.x, y: obj.endPoint.y + offset.y }
        };
        setShapes([...shapes, newShape]);
      } else {
        // TextElement
        const newText: TextElement = {
          ...obj,
          id: newId,
          position: { x: obj.position.x + offset.x, y: obj.position.y + offset.y }
        };
        setTexts([...texts, newText]);
      }
    });

    // Select the duplicated objects
    this.setSelectedObjects(newIds);
  }

  bringToFront(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    setPaths: (paths: DrawingPath[]) => void,
    setShapes: (shapes: Shape[]) => void,
    setTexts: (texts: TextElement[]) => void
  ) {
    if (this.selectedObjects.length === 0) return;

    const allObjects = [...paths, ...shapes, ...texts];
    const maxZ = Math.max(0, ...allObjects.map(obj => obj.zIndex || 0));

    setPaths(paths.map(p => 
      this.selectedObjects.includes(p.id) ? { ...p, zIndex: maxZ + 1 } : p
    ));
    setShapes(shapes.map(s => 
      this.selectedObjects.includes(s.id) ? { ...s, zIndex: maxZ + 1 } : s
    ));
    setTexts(texts.map(t => 
      this.selectedObjects.includes(t.id) ? { ...t, zIndex: maxZ + 1 } : t
    ));
  }

  sendToBack(
    paths: DrawingPath[],
    shapes: Shape[],
    texts: TextElement[],
    setPaths: (paths: DrawingPath[]) => void,
    setShapes: (shapes: Shape[]) => void,
    setTexts: (texts: TextElement[]) => void
  ) {
    if (this.selectedObjects.length === 0) return;

    const allObjects = [...paths, ...shapes, ...texts];
    const minZ = Math.min(0, ...allObjects.map(obj => obj.zIndex || 0));

    setPaths(paths.map(p => 
      this.selectedObjects.includes(p.id) ? { ...p, zIndex: minZ - 1 } : p
    ));
    setShapes(shapes.map(s => 
      this.selectedObjects.includes(s.id) ? { ...s, zIndex: minZ - 1 } : s
    ));
    setTexts(texts.map(t => 
      this.selectedObjects.includes(t.id) ? { ...t, zIndex: minZ - 1 } : t
    ));
  }
}