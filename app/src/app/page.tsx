"use client";
import React from "react";

export default function ChatDemoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Welcome to the Chat App!
          </h1>
          <p className="text-muted-foreground mb-6">
            This page verifies that TailwindCSS and ShadUI are properly configured.
          </p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
