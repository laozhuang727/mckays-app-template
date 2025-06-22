"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FigJamDashboard() {
  // Temporary mock data - will be replaced with real data from database
  const mockBoards = [
    { id: "1", name: "Design System", createdAt: "2024-01-15", thumbnail: null },
    { id: "2", name: "User Journey Map", createdAt: "2024-01-20", thumbnail: null },
    { id: "3", name: "Brainstorming Session", createdAt: "2024-01-25", thumbnail: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">FigJam Boards</h1>
            <p className="text-muted-foreground mt-2">
              Create and collaborate on visual ideas
            </p>
          </div>
          <Button asChild>
            <Link href="/figjam/new">
              <Plus className="w-4 h-4 mr-2" />
              New Board
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockBoards.map((board) => (
            <Link
              key={board.id}
              href={`/figjam/${board.id}`}
              className="group block"
            >
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Canvas Preview</span>
                </div>
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                  {board.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {mockBoards.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first board to get started
            </p>
            <Button asChild>
              <Link href="/figjam/new">
                <Plus className="w-4 h-4 mr-2" />
                Create First Board
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}