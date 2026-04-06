import { useState } from "react";
import { X } from "lucide-react";

/**
 * Interactive Demo Modal
 * Lets parents try the kid app for 2 minutes before committing
 * Dramatically improves conversion rates
 */
export function InteractiveDemo({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentTask, setCurrentTask] = useState(0);
  const [stars, setStars] = useState(0);

  const tasks = [
    { emoji: "☀️", label: "WAKE UP!", voice: "Rise and shine superstar!" },
    { emoji: "🛁", label: "SHOWER TIME!", voice: "Clean champion coming through!" },
    { emoji: "🥛", label: "EAT BREAKFAST!", voice: "Fuel up! You are a rocket!" },
    { emoji: "🪥", label: "BRUSH TEETH!", voice: "Shiniest smile in the world!" },
    { emoji: "🎒", label: "PACK YOUR BAG!", voice: "Zip it up! Ready to fly!" },
    { emoji: "🚀", label: "LET'S GO!", voice: "Daily winner! You are LEGENDARY!" },
  ];

  const handleTaskComplete = () => {
    setStars(stars + 1);
    if (currentTask < tasks.length - 1) {
      setCurrentTask(currentTask + 1);
    } else {
      // All tasks complete - show win screen
      setTimeout(() => {
        setCurrentTask(-1); // Win state
      }, 500);
    }
  };

  const resetDemo = () => {
    setCurrentTask(0);
    setStars(0);
  };

  if (!isOpen) return null;

  const task = tasks[currentTask];
  const isWinScreen = currentTask === -1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-orange-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold">Try GlowJo Now!</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center min-h-96 flex flex-col items-center justify-center">
          {!isWinScreen ? (
            <>
              {/* Task Display */}
              <div className="text-8xl mb-6 animate-bounce">{task.emoji}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{task.label}</h3>
              <p className="text-gray-600 mb-6 italic">"{task.voice}"</p>

              {/* Stars Earned */}
              <div className="mb-8">
                <p className="text-sm text-gray-600 mb-2">Stars Earned: {stars}</p>
                <div className="flex gap-1 justify-center">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className={`text-2xl ${i < stars ? "text-yellow-400" : "text-gray-300"}`}>
                        ⭐
                      </span>
                    ))}
                </div>
              </div>

              {/* Big Tap Button */}
              <button
                onClick={handleTaskComplete}
                className="px-12 py-6 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-full font-bold text-xl hover:shadow-lg transition-all hover:scale-105 mb-4"
              >
                TAP TO COMPLETE!
              </button>

              {/* Progress */}
              <p className="text-xs text-gray-500">
                Task {currentTask + 1} of {tasks.length}
              </p>
            </>
          ) : (
            <>
              {/* Win Screen */}
              <div className="text-8xl mb-6 animate-bounce">🏆</div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">YOU DID IT!</h3>
              <p className="text-5xl font-bold text-yellow-400 mb-6">{stars} ⭐</p>
              <p className="text-gray-600 mb-8 text-center">
                You completed your morning routine! <br />
                <strong>This is what GlowJo does every day.</strong>
              </p>

              <button
                onClick={resetDemo}
                className="px-8 py-3 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-colors mb-4"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            Get Started Free
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">No credit card required • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
