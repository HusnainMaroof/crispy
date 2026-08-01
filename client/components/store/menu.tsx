// menu.tsx
"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : () => {};

type Category = {
  name: string;
  image: string;
};

const leftCategories: Category[] = [
  {
    name: "Breakfast",
    image:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&h=400&fit=crop",
  },
  {
    name: "Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
  },
  {
    name: "Wraps",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop",
  },
  {
    name: "Wings",
    image:
      "https://images.unsplash.com/photo-1527477396000-e27163b4bbed?w=600&h=400&fit=crop",
  },
  {
    name: "Tenders",
    image:
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&h=400&fit=crop",
  },
  {
    name: "Fries",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop",
  },
  {
    name: "Sides",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  },
  {
    name: "Salads",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
  },
];

const rightCategories: Category[] = [
  {
    name: "Gym Box",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
  },
  {
    name: "Kids Meals",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop",
  },
  {
    name: "Desserts",
    image:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&h=400&fit=crop",
  },
  {
    name: "Coffee",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop",
  },
  {
    name: "Hot Drinks",
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop",
  },
  {
    name: "Cold Drinks",
    image:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop",
  },
  {
    name: "Shakes",
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop",
  },
  {
    name: "Sauces",
    image:
      "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&h=400&fit=crop",
  },
];

const allCategories = [...leftCategories, ...rightCategories];

export default function Menu() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const textRefs = useRef(new Map<string, HTMLSpanElement>());
  const floatImageRef = useRef<HTMLDivElement>(null);
  const floatImgInnerRef = useRef<HTMLImageElement>(null);
  const [hoveredCat, setHoveredCat] = useState<Category | null>(null);
  const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);
  const [hoveredText, setHoveredText] = useState<HTMLSpanElement | null>(null);
  // Keeps the <img> element mounted permanently so src just swaps —
  // never unmount/remount on hover changes, which was the flash/glitch source.
  const [lastCat, setLastCat] = useState<Category | null>(null);

  const handleEnter = (cat: Category, el: HTMLElement) => {
    setHoveredCat(cat);
    setLastCat(cat);
    setHoveredEl(el);
    setHoveredText(textRefs.current.get(cat.name) ?? null);
  };

  const handleLeave = (e: React.MouseEvent<HTMLLIElement>) => {
    // If the pointer is moving straight into another menu item (or the
    // floating image itself), that element's onMouseEnter will replace
    // state on its own — skip clearing here so hoveredCat never passes
    // through null between items and the <img> never unmounts.
    const related = e.relatedTarget as Node | null;
    if (
      related &&
      containerRef.current?.contains(related) &&
      (related as HTMLElement).closest?.("li")
    ) {
      return;
    }
    setHoveredCat(null);
    setHoveredEl(null);
    setHoveredText(null);
  };

  // Persistent bob loop — runs once, independent of hover state, so
  // switching categories never snaps the image back to y:0 mid-bob.
  useIsoLayoutEffect(() => {
    const imgInner = floatImgInnerRef.current;
    if (!imgInner) return;

    const tween = gsap.to(imgInner, {
      y: -7,
      duration: 1.1,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    return () => {
      tween.kill();
    };
  }, []);

  useIsoLayoutEffect(() => {
    const items = itemRefs.current.filter(Boolean) as HTMLLIElement[];
    const image = floatImageRef.current;

    gsap.killTweensOf(items);
    if (image) gsap.killTweensOf(image);

    if (!hoveredEl || !hoveredText || !containerRef.current || !image) {
      gsap.to(items, {
        opacity: 1,
        filter: "blur(0px)",
        color: "#000000",
        x: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.02,
        overwrite: "auto",
      });
      if (image) {
        gsap.to(image, {
          opacity: 0,
          scale: 0.85,
          duration: 0.3,
          ease: "power2.in",
          overwrite: "auto",
        });
      }
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;

    items.forEach((el) => {
      const isHovered = el === hoveredEl;
      const elRect = el.getBoundingClientRect();
      const isLeft = elRect.left + elRect.width / 2 < containerCenterX;
      gsap.to(el, {
        opacity: isHovered ? 1 : 0.12,
        filter: isHovered ? "blur(0px)" : "blur(2.5px)",
        color: isHovered ? "#FF0931" : "#000000",
        x: isHovered ? (isLeft ? 12 : -12) : 0,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    const textRect = hoveredText.getBoundingClientRect();
    const imgW = image.offsetWidth || 300;
    const imgH = image.offsetHeight || 220;
    const isLeft = textRect.left + textRect.width / 2 < containerCenterX;
    const gap = 24;
    let x = isLeft
      ? textRect.right - containerRect.left + gap + imgW / 2
      : textRect.left - containerRect.left - gap - imgW / 2;
    x = gsap.utils.clamp(imgW / 2 + 12, containerRect.width - imgW / 2 - 12, x);
    const y = gsap.utils.clamp(
      imgH / 2 + 12,
      containerRect.height - imgH / 2 - 12,
      textRect.top + textRect.height / 2 - containerRect.top,
    );

    gsap.to(image, {
      x,
      y,
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto",
    });
  }, [hoveredEl]);

  const itemClass =
    "cursor-pointer select-none leading-[110%] capitalize will-change-[filter,opacity,color,transform]";

  const itemStyle = {
    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
    fontSize: "clamp(22px, 6vw, 140px)",
    color: "#000000",
  };

  return (
    <section className="relative w-full bg-white py-16 md:py-24 lg:py-28 overflow-hidden">
      {/* Preload all category images so hover swaps are instant */}
      <div className="hidden" aria-hidden="true">
        {allCategories.map((cat) => (
          <img key={cat.name} src={cat.image} alt="" loading="eager" />
        ))}
      </div>

      <div className="mx-auto max-w-[1280px] px-6 xl:px-10">
        <div
          ref={containerRef}
          className="relative flex flex-row items-center justify-center gap-6 md:gap-10 lg:gap-16 xl:gap-24"
        >
          {/* Left column */}
          <ul className="flex-1 flex flex-col min-w-0">
            {leftCategories.map((cat, i) => (
              <li
                key={cat.name}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onMouseEnter={(e) => handleEnter(cat, e.currentTarget)}
                onMouseLeave={handleLeave}
                className={`${itemClass} text-center md:text-left`}
                style={itemStyle}
              >
                <span
                  ref={(el) => {
                    if (el) textRefs.current.set(cat.name, el);
                  }}
                  className="inline-block whitespace-nowrap"
                >
                  {cat.name}
                </span>
              </li>
            ))}
          </ul>

          {/* Right column */}
          <ul className="flex-1 flex flex-col min-w-0">
            {rightCategories.map((cat, i) => (
              <li
                key={cat.name}
                ref={(el) => {
                  itemRefs.current[leftCategories.length + i] = el;
                }}
                onMouseEnter={(e) => handleEnter(cat, e.currentTarget)}
                onMouseLeave={handleLeave}
                className={`${itemClass} text-center md:text-left`}
                style={itemStyle}
              >
                <span
                  ref={(el) => {
                    if (el) textRefs.current.set(cat.name, el);
                  }}
                  className="inline-block whitespace-nowrap"
                >
                  {cat.name}
                </span>
              </li>
            ))}
          </ul>

          {/* Floating image — follows the hovered menu item (desktop only).
              Always mounted once lastCat is set; only src swaps on hover
              change, so there's no unmount/remount flash between items. */}
          <div
            ref={floatImageRef}
            className="hidden lg:block absolute top-0 left-0 w-[300px] xl:w-[340px] pointer-events-none will-change-transform transform-gpu"
            style={{ opacity: 0, scale: 0.85 }}
          >
            {lastCat && (
              <img
                ref={floatImgInnerRef}
                src={lastCat.image}
                alt={lastCat.name}
                className="w-full h-[220px] xl:h-[250px] object-cover rounded-2xl shadow-xl"
                draggable={false}
                loading="eager"
                decoding="async"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
