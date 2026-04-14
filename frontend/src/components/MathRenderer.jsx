import { useEffect, useRef } from "react";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";

export default function MathRenderer({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      renderMathInElement(ref.current, {
        delimiters: [
          { left: "$$",  right: "$$",  display: true  },
          { left: "\\[", right: "\\]", display: true  },
          { left: "$",   right: "$",   display: false },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
  }, [text]);
  return (
    <div ref={ref}
      className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}