"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgressIndicator() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (!fillRef.current) return;
      const { scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) return;
      const progress = (window.scrollY / scrollable) * 100;
      fillRef.current.style.transform = `translateY(-${100 - progress}%)`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="fixed top-1/2 right-[2%] z-40 h-[100px] w-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10"
      aria-hidden
    >
      <div
        ref={fillRef}
        className="h-full w-full rounded-full bg-brand-red"
        style={{ transform: "translateY(-100%)" }}
      />
    </div>
  );
}