"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";

export type ToolType = "select" | "pen" | "rectangle" | "circle" | "text" | "eraser";

export interface DrawingStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
}

export interface DrawingState {
  currentTool: ToolType;
  style: DrawingStyle;
  isPanning: boolean;
  isDrawing: boolean;
  currentPath: Array<{ x: number; y: number }>;
}

type DrawingAction =
  | { type: "SET_TOOL"; payload: ToolType }
  | { type: "SET_STYLE"; payload: Partial<DrawingStyle> }
  | { type: "SET_IS_PANNING"; payload: boolean }
  | { type: "SET_IS_DRAWING"; payload: boolean }
  | { type: "START_PATH"; payload: { x: number; y: number } }
  | { type: "ADD_TO_PATH"; payload: { x: number; y: number } }
  | { type: "END_PATH" }
  | { type: "CLEAR_PATH" };

const initialState: DrawingState = {
  currentTool: "select",
  style: {
    strokeColor: "#000000",
    fillColor: "transparent",
    strokeWidth: 2,
    fontSize: 16,
    fontFamily: "Arial",
  },
  isPanning: false,
  isDrawing: false,
  currentPath: [],
};

function drawingReducer(state: DrawingState, action: DrawingAction): DrawingState {
  switch (action.type) {
    case "SET_TOOL":
      return {
        ...state,
        currentTool: action.payload,
        isDrawing: false,
        currentPath: [],
      };
    case "SET_STYLE":
      return {
        ...state,
        style: { ...state.style, ...action.payload },
      };
    case "SET_IS_PANNING":
      return {
        ...state,
        isPanning: action.payload,
      };
    case "SET_IS_DRAWING":
      return {
        ...state,
        isDrawing: action.payload,
      };
    case "START_PATH":
      return {
        ...state,
        isDrawing: true,
        currentPath: [action.payload],
      };
    case "ADD_TO_PATH":
      return {
        ...state,
        currentPath: [...state.currentPath, action.payload],
      };
    case "END_PATH":
      return {
        ...state,
        isDrawing: false,
      };
    case "CLEAR_PATH":
      return {
        ...state,
        currentPath: [],
        isDrawing: false,
      };
    default:
      return state;
  }
}

interface DrawingContextType {
  state: DrawingState;
  dispatch: React.Dispatch<DrawingAction>;
}

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

export function DrawingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(drawingReducer, initialState);

  return (
    <DrawingContext.Provider value={{ state, dispatch }}>
      {children}
    </DrawingContext.Provider>
  );
}

export function useDrawing() {
  const context = useContext(DrawingContext);
  if (context === undefined) {
    throw new Error("useDrawing must be used within a DrawingProvider");
  }
  return context;
}