import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import AudioEditor from './components/AudioEditor';
import DownloadLink from './components/DownloadLink';
import Spinner from './components/Spinner';

export type ProcessedUrls = {
  wav: string | null;
  mp3: string | null;
}

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedUrls, setProcessedUrls] = useState<ProcessedUrls>({ wav: null, mp3: null });
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<number>(Date.now()); // Key to reset editor component

  const handleFileSelect = (file: File) => {
    if (file.type !== 'audio/mpeg' && file.type !== 'audio/wav') {
      setError('Invalid file type. Please upload an MP3 or WAV file.');
      return;
    }
    setError(null);
    setAudioFile(file);
    setProcessedUrls({ wav: null, mp3: null });
  };

  const handleReset = () => {
    setAudioFile(null);
    setProcessedUrls({ wav: null, mp3: null });
    setIsProcessing(false);
    setError(null);
    setKey(Date.now()); // Change key to force re-mount of children
  };

  const wavFilename = audioFile?.type === 'audio/mpeg' ? 'LockChime.wav' : 'edited-audio.wav';
  const mp3Filename = 'edited-audio.mp3';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
            Tesla MP3 to WAV Editor
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            Drag and drop your MP3 lock sound here. It will be converted to <span className="font-mono bg-slate-700/50 rounded px-1.5 py-0.5 text-teal-300">LockChime.wav</span>, ready to be copied to your Tesla's USB drive.
          </p>
        </header>

        <main className="bg-slate-800/50 rounded-xl shadow-2xl p-6 sm:p-8 border border-slate-700">
          {isProcessing && <Spinner />}
          {error && (
             <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6 text-center">
                {error}
             </div>
          )}
          {!audioFile ? (
            <FileUpload onFileSelect={handleFileSelect} />
          ) : (
            <>
              <AudioEditor
                key={key}
                audioFile={audioFile}
                setIsProcessing={setIsProcessing}
                setProcessedUrls={setProcessedUrls}
                setError={setError}
              />
               <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {processedUrls.wav && <DownloadLink url={processedUrls.wav} filename={wavFilename} format="wav" />}
                  {processedUrls.mp3 && <DownloadLink url={processedUrls.mp3} filename={mp3Filename} format="mp3" />}
                  
                  {(processedUrls.wav || processedUrls.mp3) && (
                    <button
                      onClick={handleReset}
                      className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      Edit New File
                    </button>
                  )}
               </div>
            </>
          )}
        </main>

        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Tesla MP3 to WAV Editor. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;