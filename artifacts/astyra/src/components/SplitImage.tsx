import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SplitImageProps {
  beforeSrc: string;
  afterSrc: string;
  className?: string;
}

export function SplitImage({ beforeSrc, afterSrc, className }: SplitImageProps) {
  const [splitPos, setSplitPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSplitPos((x / rect.width) * 100);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchend", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full aspect-[3/4] md:aspect-square max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-rose-900/10 cursor-col-resize select-none", className)}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Before Image (Background) */}
      <img 
        src={beforeSrc} 
        alt="Before" 
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* After Image (Clipped) */}
      <div 
        className="absolute inset-0 clip-split"
        style={{ '--split-pos': `${splitPos}%` } as React.CSSProperties}
      >
        <img 
          src={afterSrc} 
          alt="After" 
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Splitter Line & Handle */}
      <div 
        className="absolute inset-y-0 w-1 bg-white/80 shadow-[0_0_10px_rgba(0,0,0,0.3)] transform -translate-x-1/2 flex items-center justify-center pointer-events-none"
        style={{ left: `${splitPos}%` }}
      >
        <div className="w-8 h-12 bg-white/90 backdrop-blur rounded-full shadow-lg border border-rose-100/50 flex items-center justify-center gap-1">
          <div className="w-0.5 h-6 bg-rose-200 rounded-full" />
          <div className="w-0.5 h-6 bg-rose-200 rounded-full" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/30 backdrop-blur-md text-white text-xs font-semibold rounded-full tracking-wider uppercase">
        Before
      </div>
      <div className="absolute top-6 right-6 px-4 py-1.5 bg-primary/80 backdrop-blur-md text-white text-xs font-semibold rounded-full tracking-wider uppercase">
        After
      </div>
    </div>
  );
}
