"use client";

import { createElement, useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Anima el contenido con un fade-up cuando entra en el viewport (una sola vez).
 * Respeta prefers-reduced-motion mediante CSS (.zentro-reveal en globals.css).
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(
    Tag,
    { ref, "data-show": show, className: `zentro-reveal ${className}`, style: { animationDelay: `${delay}ms` } },
    children,
  );
}
