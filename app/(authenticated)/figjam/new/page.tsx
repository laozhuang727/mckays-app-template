"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewBoard() {
  const router = useRouter();

  useEffect(() => {
    // For now, just redirect to a demo board
    // In the future, this will create a new board in the database and redirect to it
    const boardId = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    router.push(`/figjam/${boardId}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Creating new board...</h2>
        <p className="text-muted-foreground">Please wait while we set up your canvas</p>
      </div>
    </div>
  );
}