export type ToolType = "select" | "pen" | "rectangle" | "circle" | "text" | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  points: Point[];
  color: string;
  width: number;
  rotation?: number;
  zIndex?: number;
}

export interface Shape {
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

export interface TextElement {
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

export interface DrawableObject {
  id: string;
  type: "path" | "rectangle" | "circle" | "text";
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CanvasState {
  paths: DrawingPath[];
  shapes: Shape[];
  texts: TextElement[];
}

export interface Command {
  execute: () => void;
  undo: () => void;
  description: string;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface CanvasBoardProps {
  boardId: string;
}