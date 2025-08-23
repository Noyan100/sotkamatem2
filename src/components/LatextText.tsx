"use client";

import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface LatexTextProps {
  content?: string;
  className?: string;
}

export const LatexText = ({ content, className }: LatexTextProps) => {
  if (!content) return null;

  const latexRegex =
    /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\begin\{.*?\\end\{.*?\})/;
  const parts = content.split(latexRegex);

  return (
    <div className={className} style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        }
        if (part.startsWith("\\[") && part.endsWith("\\]")) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        }
        if (part.startsWith("\\(") && part.endsWith("\\)")) {
          return <InlineMath key={index} math={part.slice(2, -2)} />;
        }
        if (part.startsWith("\\begin{") && part.includes("\\end{")) {
          return <BlockMath key={index} math={part} />;
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};
