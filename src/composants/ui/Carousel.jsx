"use client";

import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

export default function Carousel({ children, itemsPerView = 4, gap = "gap-3", autoScroll = false, scrollInterval = 5000 }) {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Vérifier la position du scroll
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Auto-scroll
  useEffect(() => {
    if (!autoScroll) return;
    
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        
        if (scrollLeft + clientWidth >= scrollWidth) {
          scrollContainerRef.current.scrollLeft = 0;
        } else {
          scrollContainerRef.current.scrollLeft += clientWidth / 2;
        }
        checkScroll();
      }
    }, scrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, scrollInterval]);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX - (scrollContainerRef.current?.left || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    
    const x = e.clientX - (scrollContainerRef.current?.left || 0);
    const walk = (x - dragStart) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Scroll handlers
  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 320; // Largeur environ d'une carte + gap
    const container = scrollContainerRef.current;
    
    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
    
    // Attendre la fin du scroll pour vérifier les flèches
    setTimeout(checkScroll, 400);
  };

  const gapValue = gap === "gap-3" ? 12 : gap === "gap-4" ? 16 : 12;

  return (
    <div className="relative group">
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`audiva-carousel flex ${gap} overflow-x-auto scroll-smooth cursor-grab active:cursor-grabbing`}
        style={{ scrollBehavior: "smooth" }}
      >
        {Array.isArray(children) 
          ? children.map((child, idx) => (
              <div key={idx} style={{ flexShrink: 0 }}>
                {child}
              </div>
            ))
          : children}
      </div>

      {/* Flèche gauche */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-gradient-to-r from-[#060b18] via-[#060b18]/80 to-transparent hover:from-[#0f1a2e] transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
          aria-label="Défiler vers la gauche"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} className="text-[#72eee7]" />
        </button>
      )}

      {/* Flèche droite */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-gradient-to-l from-[#060b18] via-[#060b18]/80 to-transparent hover:from-[#0f1a2e] transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
          aria-label="Défiler vers la droite"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={24} className="text-[#72eee7]" />
        </button>
      )}
    </div>
  );
}
