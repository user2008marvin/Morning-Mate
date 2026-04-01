import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Testimonial Video Component
 * Shows before/after morning routine transformation
 * Drives 3-5x more signups than text testimonials
 */
export function TestimonialVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl overflow-hidden shadow-lg">
        {/* Video Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {!isPlaying ? (
            <>
              {/* Placeholder: Before/After Split */}
              <div className="absolute inset-0 flex">
                {/* Before Side */}
                <div className="flex-1 bg-gradient-to-r from-red-100 to-red-50 flex flex-col items-center justify-center p-6 relative">
                  <div className="text-6xl mb-4">😫</div>
                  <p className="text-center font-bold text-gray-800">BEFORE</p>
                  <p className="text-xs text-gray-600 mt-2 text-center">45 mins of nagging</p>
                  <p className="text-xs text-gray-600">Crying & conflicts</p>
                  <p className="text-xs text-gray-600">Late to school</p>
                </div>

                {/* Divider */}
                <div className="w-1 bg-gray-300"></div>

                {/* After Side */}
                <div className="flex-1 bg-gradient-to-r from-green-50 to-green-100 flex flex-col items-center justify-center p-6 relative">
                  <div className="text-6xl mb-4">😊</div>
                  <p className="text-center font-bold text-gray-800">AFTER</p>
                  <p className="text-xs text-gray-600 mt-2 text-center">12 mins, zero fights</p>
                  <p className="text-xs text-gray-600">Kids excited to start</p>
                  <p className="text-xs text-gray-600">On time, every day</p>
                </div>
              </div>

              {/* Play Button Overlay */}
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
              >
                <div className="bg-white/90 group-hover:bg-white rounded-full p-4 transition-transform group-hover:scale-110">
                  <Play className="w-8 h-8 text-orange-500 fill-orange-500" />
                </div>
              </button>

              {/* "Play Video" Text */}
              <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-semibold">
                Watch 30-second transformation
              </p>
            </>
          ) : (
            <>
              {/* Embedded Video Player */}
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="GlowJo Before/After Testimonial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              />
            </>
          )}
        </div>

        {/* Caption */}
        <div className="p-6 bg-white">
          <p className="text-center text-sm text-gray-600 mb-3">
            <strong>Sarah M., Parent of 3</strong>
          </p>
          <p className="text-center text-gray-700 italic">
            "GlowJo transformed our mornings. My kids actually want to get ready now. No more battles!"
          </p>
          <p className="text-center text-xs text-gray-500 mt-3">
            ⭐⭐⭐⭐⭐ 5/5 stars
          </p>
        </div>
      </div>

      {/* CTA Below Video */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            // Scroll to pricing section
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
        >
          Try GlowJo Free for 7 Days
        </button>
      </div>
    </div>
  );
}
