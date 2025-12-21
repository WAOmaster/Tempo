import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  onTick?: (remainingMs: number) => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onTick }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  // Use a ref to keep track of the latest onTick callback
  // This allows us to call it inside useEffect without adding it to the dependency array,
  // preventing infinite loops when the parent passes an inline function that updates state.
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (onTickRef.current) onTickRef.current(difference);

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          total: difference
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center mx-2 md:mx-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 w-16 h-20 md:w-24 md:h-28 flex items-center justify-center shadow-lg shadow-black/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        <span className="text-2xl md:text-5xl font-mono font-bold text-white z-10">
          {value.toString().padStart(2, '0')}
        </span>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-accent-500/5 group-hover:bg-accent-500/10 transition-colors duration-500" />
      </div>
      <span className="text-xs md:text-sm text-gray-400 mt-2 font-medium tracking-wider uppercase">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex items-center text-accent-400 mb-6 space-x-2">
        <Clock className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-semibold tracking-widest uppercase">Time Remaining</span>
      </div>
      <div className="flex flex-wrap justify-center items-end">
        <TimeBlock value={timeLeft.days} label="Days" />
        <div className="hidden md:block pb-12 text-2xl text-gray-600">:</div>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <div className="hidden md:block pb-12 text-2xl text-gray-600">:</div>
        <TimeBlock value={timeLeft.minutes} label="Mins" />
        <div className="hidden md:block pb-12 text-2xl text-gray-600">:</div>
        <TimeBlock value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
};

export default CountdownTimer;