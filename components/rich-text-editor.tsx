"use client";

import React from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function RichTextEditor({ value, onChange, disabled, readOnly }: RichTextEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border rounded-md"
      rows={5}
      placeholder="Enter notes..."
      disabled={disabled}
      readOnly={readOnly}
    />
  );
} 