"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NewChatButton({ onClick, disabled }: NewChatButtonProps) {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={onClick}
      className="flex items-center gap-2"
      disabled={disabled}
    >
      <Plus className="h-4 w-4" />
      <span>New Chat</span>
    </Button>
  );
}

