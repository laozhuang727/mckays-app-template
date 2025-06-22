"use client";

import { createContext, useContext, useReducer, useRef, ReactNode } from "react";

export interface Point {
  x: number;
  y: number;
}

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface CanvasState {
  viewport: ViewportState;
  objects: DrawingObject[];
  selectedIds: string[];
  isDrawing: boolean;
  canvasSize: { width: number; height: number };
}

export interface DrawingObject {
  id: string;
  type: "path" | "rectangle" | "circle" | "text";
  position: Point;
  properties: Record<string, any>;
  style: {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
  };
}

type CanvasAction =
  | { type: "SET_VIEWPORT"; payload: Partial<ViewportState> }
  | { type: "ADD_OBJECT"; payload: DrawingObject }
  | { type: "UPDATE_OBJECT"; payload: { id: string; updates: Partial<DrawingObject> } }
  | { type: "DELETE_OBJECTS"; payload: string[] }
  | { type: "SET_SELECTED"; payload: string[] }
  | { type: "SET_IS_DRAWING"; payload: boolean }
  | { type: "SET_CANVAS_SIZE"; payload: { width: number; height: number } }
  | { type: "CLEAR_CANVAS" };

const initialState: CanvasState = {
  viewport: {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  },
  objects: [],
  selectedIds: [],
  isDrawing: false,
  canvasSize: { width: 800, height: 600 },
};

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case "SET_VIEWPORT":
      return {
        ...state,
        viewport: { ...state.viewport, ...action.payload },
      };
    case "ADD_OBJECT":
      return {
        ...state,
        objects: [...state.objects, action.payload],
      };
    case "UPDATE_OBJECT":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.payload.id
            ? { ...obj, ...action.payload.updates }
            : obj
        ),
      };
    case "DELETE_OBJECTS":
      return {
        ...state,
        objects: state.objects.filter((obj) => !action.payload.includes(obj.id)),
        selectedIds: state.selectedIds.filter((id) => !action.payload.includes(id)),
      };
    case "SET_SELECTED":
      return {
        ...state,
        selectedIds: action.payload,
      };
    case "SET_IS_DRAWING":
      return {
        ...state,
        isDrawing: action.payload,
      };
    case "SET_CANVAS_SIZE":
      return {
        ...state,
        canvasSize: action.payload,
      };
    case "CLEAR_CANVAS":
      return {
        ...state,
        objects: [],
        selectedIds: [],
        isDrawing: false,
      };
    default:
      return state;
  }
}

interface CanvasContextType {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  screenToCanvas: (point: Point) => Point;
  canvasToScreen: (point: Point) => Point;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const screenToCanvas = (point: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return point;

    const rect = canvas.getBoundingClientRect();
    const x = (point.x - rect.left - state.viewport.offsetX) / state.viewport.scale;
    const y = (point.y - rect.top - state.viewport.offsetY) / state.viewport.scale;
    
    return { x, y };
  };

  const canvasToScreen = (point: Point): Point => {
    const x = point.x * state.viewport.scale + state.viewport.offsetX;
    const y = point.y * state.viewport.scale + state.viewport.offsetY;
    
    return { x, y };
  };

  return (
    <CanvasContext.Provider
      value={{
        state,
        dispatch,
        canvasRef,
        screenToCanvas,
        canvasToScreen,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}