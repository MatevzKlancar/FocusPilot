import React from "react";

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className = "" }: MarkdownTextProps) {
  // Simple markdown parsing for common formatting
  const parseMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let keyCounter = 0;

    // Find all bold text (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }

      // Add the bold text
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-semibold">
          {match[1]}
        </strong>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Split by newlines to handle line breaks
  const lines = content.split("\n");

  return (
    <div className={className}>
      {lines.map((line, index) => (
        <div key={index} className={index > 0 ? "mt-2" : ""}>
          {line.trim() === "" ? <br /> : <span>{parseMarkdown(line)}</span>}
        </div>
      ))}
    </div>
  );
}
