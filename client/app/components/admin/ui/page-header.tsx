"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".ph-title", { x: -15, autoAlpha: 0, duration: 0.45 });
    if (description) tl.from(".ph-desc", { x: -10, autoAlpha: 0, duration: 0.35 }, "-=0.25");
    if (action) tl.from(".ph-action", { x: 10, autoAlpha: 0, duration: 0.35 }, "-=0.2");
  }, { scope: ref });

  return (
    <div ref={ref} className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="ph-title font-display text-3xl tracking-wide text-white">{title}</h1>
        {description && <p className="ph-desc mt-1 text-sm text-white/50">{description}</p>}
      </div>
      {action && <div className="ph-action">{action}</div>}
    </div>
  );
}
