
import React from 'react';

interface SpinnerProps {
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ text = 'Processing audio...' }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-400"></div>
      <p className="text-white text-lg mt-4">{text}</p>
    </div>
  );
};

export default Spinner;