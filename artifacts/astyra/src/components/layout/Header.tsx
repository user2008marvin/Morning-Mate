import { useState } from "react";
import { Link, useLocation } from "wouter";

export function Header() {
  const [clicks, setClicks] = useState(0);
  const [, setLocation] = useLocation();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newClicks = clicks + 1;
    setClicks(newClicks);
    
    if (newClicks >= 5) {
      setClicks(0);
      setLocation("/admin");
    }
    
    // Reset clicks after 2 seconds of inactivity
    setTimeout(() => {
      setClicks(prev => Math.max(0, prev - 1));
    }, 2000);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-white/40 h-20 flex items-center justify-center px-4 transition-all duration-300">
      <Link href="/" className="inline-block" onClick={handleLogoClick}>
        <img 
          src={`${import.meta.env.BASE_URL}images/logo.png`} 
          alt="Astyra" 
          className="h-8 md:h-10 object-contain hover:opacity-80 transition-opacity" 
        />
      </Link>
    </header>
  );
}
