import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <img
        src="/froymon_logo.png"
        alt="Logo"
        className="h-24 w-auto animate-bounce"
      />
      <p className="mt-4 text-black animate-pulse">Loading...</p>
    </div>
  );
};

export default Loading;
