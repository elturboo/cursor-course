"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "text" | "image";

interface ModeToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex gap-1 rounded-lg border bg-card p-1">
      <Button
        variant={mode === "text" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("text")}
        className={cn(
          "flex items-center gap-2",
          mode === "text" && "bg-primary text-primary-foreground"
        )}
      >
        <MessageSquare className="h-4 w-4" />
        <span>Chat</span>
      </Button>
      <Button
        variant={mode === "image" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("image")}
        className={cn(
          "flex items-center gap-2",
          mode === "image" && "bg-primary text-primary-foreground"
        )}
      >
        <ImageIcon className="h-4 w-4" />
        <span>Image</span>
      </Button>
    </div>
  );
}

