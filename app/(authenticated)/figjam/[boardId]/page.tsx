import { CanvasBoard } from "../_components/canvas-board";

interface FigJamBoardPageProps {
  params: {
    boardId: string;
  };
}

export default function FigJamBoardPage({ params }: FigJamBoardPageProps) {
  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50">
      <CanvasBoard boardId={params.boardId} />
    </div>
  );
}