import { Command, DrawingPath, Shape, TextElement } from './types';

export class CommandSystem {
  private history: Command[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 50;

  executeCommand(command: Command) {
    command.execute();
    
    // Remove any commands after the current index (for branching undo/redo)
    const newHistory = this.history.slice(0, this.historyIndex + 1);
    newHistory.push(command);
    
    // Limit history size to prevent memory issues
    if (newHistory.length > this.maxHistorySize) {
      newHistory.shift();
    } else {
      this.historyIndex++;
    }
    
    this.history = newHistory;
  }

  undo(): boolean {
    if (this.historyIndex >= 0) {
      const command = this.history[this.historyIndex];
      command.undo();
      this.historyIndex--;
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const command = this.history[this.historyIndex];
      command.execute();
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  clear() {
    this.history = [];
    this.historyIndex = -1;
  }
}

// Command factory functions
export const createAddPathCommand = (
  path: DrawingPath,
  paths: DrawingPath[],
  setPaths: (paths: DrawingPath[]) => void
): Command => ({
  execute: () => setPaths([...paths, path]),
  undo: () => setPaths(paths.filter(p => p.id !== path.id)),
  description: `Add path ${path.id}`
});

export const createAddShapeCommand = (
  shape: Shape,
  shapes: Shape[],
  setShapes: (shapes: Shape[]) => void
): Command => ({
  execute: () => setShapes([...shapes, shape]),
  undo: () => setShapes(shapes.filter(s => s.id !== shape.id)),
  description: `Add shape ${shape.id}`
});

export const createAddTextCommand = (
  text: TextElement,
  texts: TextElement[],
  setTexts: (texts: TextElement[]) => void
): Command => ({
  execute: () => setTexts([...texts, text]),
  undo: () => setTexts(texts.filter(t => t.id !== text.id)),
  description: `Add text ${text.id}`
});

export const createDeleteObjectsCommand = (
  objectIds: string[],
  paths: DrawingPath[],
  shapes: Shape[],
  texts: TextElement[],
  setPaths: (paths: DrawingPath[]) => void,
  setShapes: (shapes: Shape[]) => void,
  setTexts: (texts: TextElement[]) => void
): Command => {
  const deletedPaths = paths.filter(p => objectIds.includes(p.id));
  const deletedShapes = shapes.filter(s => objectIds.includes(s.id));
  const deletedTexts = texts.filter(t => objectIds.includes(t.id));

  return {
    execute: () => {
      setPaths(paths.filter(p => !objectIds.includes(p.id)));
      setShapes(shapes.filter(s => !objectIds.includes(s.id)));
      setTexts(texts.filter(t => !objectIds.includes(t.id)));
    },
    undo: () => {
      setPaths([...paths, ...deletedPaths]);
      setShapes([...shapes, ...deletedShapes]);
      setTexts([...texts, ...deletedTexts]);
    },
    description: `Delete ${objectIds.length} objects`
  };
};

export const createMoveObjectsCommand = (
  objectIds: string[],
  deltaX: number,
  deltaY: number,
  paths: DrawingPath[],
  shapes: Shape[],
  texts: TextElement[],
  setPaths: (paths: DrawingPath[]) => void,
  setShapes: (shapes: Shape[]) => void,
  setTexts: (texts: TextElement[]) => void
): Command => ({
  execute: () => {
    setPaths(paths.map(path => 
      objectIds.includes(path.id) 
        ? { ...path, points: path.points.map(p => ({ x: p.x + deltaX, y: p.y + deltaY })) }
        : path
    ));
    setShapes(shapes.map(shape =>
      objectIds.includes(shape.id)
        ? {
            ...shape,
            startPoint: { x: shape.startPoint.x + deltaX, y: shape.startPoint.y + deltaY },
            endPoint: { x: shape.endPoint.x + deltaX, y: shape.endPoint.y + deltaY }
          }
        : shape
    ));
    setTexts(texts.map(text =>
      objectIds.includes(text.id)
        ? { ...text, position: { x: text.position.x + deltaX, y: text.position.y + deltaY } }
        : text
    ));
  },
  undo: () => {
    setPaths(paths.map(path => 
      objectIds.includes(path.id) 
        ? { ...path, points: path.points.map(p => ({ x: p.x - deltaX, y: p.y - deltaY })) }
        : path
    ));
    setShapes(shapes.map(shape =>
      objectIds.includes(shape.id)
        ? {
            ...shape,
            startPoint: { x: shape.startPoint.x - deltaX, y: shape.startPoint.y - deltaY },
            endPoint: { x: shape.endPoint.x - deltaX, y: shape.endPoint.y - deltaY }
          }
        : shape
    ));
    setTexts(texts.map(text =>
      objectIds.includes(text.id)
        ? { ...text, position: { x: text.position.x - deltaX, y: text.position.y - deltaY } }
        : text
    ));
  },
  description: `Move ${objectIds.length} objects`
});

export const createResizeObjectCommand = (
  objectId: string,
  newBounds: { x: number; y: number; width: number; height: number },
  paths: DrawingPath[],
  shapes: Shape[],
  texts: TextElement[],
  setPaths: (paths: DrawingPath[]) => void,
  setShapes: (shapes: Shape[]) => void,
  setTexts: (texts: TextElement[]) => void
): Command => {
  const oldPath = paths.find(p => p.id === objectId);
  const oldShape = shapes.find(s => s.id === objectId);
  const oldText = texts.find(t => t.id === objectId);

  return {
    execute: () => {
      if (oldShape) {
        setShapes(shapes.map(shape =>
          shape.id === objectId
            ? {
                ...shape,
                startPoint: { x: newBounds.x, y: newBounds.y },
                endPoint: { x: newBounds.x + newBounds.width, y: newBounds.y + newBounds.height }
              }
            : shape
        ));
      }
      // Note: Path and text resizing would require more complex logic
    },
    undo: () => {
      if (oldShape) {
        setShapes(shapes.map(shape => shape.id === objectId ? oldShape : shape));
      }
    },
    description: `Resize object ${objectId}`
  };
};

export const createChangeStyleCommand = (
  objectIds: string[],
  styleChanges: Partial<{ color: string; width: number; fillColor: string; fontSize: number }>,
  paths: DrawingPath[],
  shapes: Shape[],
  texts: TextElement[],
  setPaths: (paths: DrawingPath[]) => void,
  setShapes: (shapes: Shape[]) => void,
  setTexts: (texts: TextElement[]) => void
): Command => {
  const oldPaths = paths.filter(p => objectIds.includes(p.id));
  const oldShapes = shapes.filter(s => objectIds.includes(s.id));
  const oldTexts = texts.filter(t => objectIds.includes(t.id));

  return {
    execute: () => {
      setPaths(paths.map(path =>
        objectIds.includes(path.id) ? { ...path, ...styleChanges } : path
      ));
      setShapes(shapes.map(shape =>
        objectIds.includes(shape.id) ? { ...shape, ...styleChanges } : shape
      ));
      setTexts(texts.map(text =>
        objectIds.includes(text.id) ? { ...text, ...styleChanges } : text
      ));
    },
    undo: () => {
      oldPaths.forEach(oldPath => {
        setPaths(paths.map(path => path.id === oldPath.id ? oldPath : path));
      });
      oldShapes.forEach(oldShape => {
        setShapes(shapes.map(shape => shape.id === oldShape.id ? oldShape : shape));
      });
      oldTexts.forEach(oldText => {
        setTexts(texts.map(text => text.id === oldText.id ? oldText : text));
      });
    },
    description: `Change style of ${objectIds.length} objects`
  };
};