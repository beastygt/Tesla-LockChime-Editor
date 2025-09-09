import React from 'react';

interface DownloadLinkProps {
  url: string;
  filename: string;
  format: 'wav' | 'mp3';
}

const DownloadLink: React.FC<DownloadLinkProps> = ({ url, filename, format }) => {
  const baseClasses = "w-full sm:w-auto text-center text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center justify-center gap-2";
  const formatClasses = format === 'wav' 
    ? "bg-green-500 hover:bg-green-600" 
    : "bg-blue-500 hover:bg-blue-600";
    
  return (
    <a
      href={url}
      download={filename}
      className={`${baseClasses} ${formatClasses}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Download {format.toUpperCase()}
    </a>
  );
};

export default DownloadLink;