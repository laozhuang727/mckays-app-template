import { CanvasBoard } from "../_components/canvas-board";

interface FigJamBoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default async function FigJamBoardPage({ params }: FigJamBoardPageProps) {
  const { boardId } = await params;
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50">
      <CanvasBoard boardId={boardId} />
    </div>
  );
}