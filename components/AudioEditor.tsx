import React, { useRef, useEffect, useState } from 'react';
import { processAudio } from '../services/audioService';
import { ProcessedUrls } from '../App';

// TypeScript declarations for WaveSurfer.js and its plugins from global scope
declare global {
  interface Window {
    WaveSurfer: any;
    lamejs: any;
  }
}

interface AudioEditorProps {
  audioFile: File;
  setIsProcessing: (isProcessing: boolean) => void;
  setProcessedUrls: React.Dispatch<React.SetStateAction<ProcessedUrls>>;
  setError: (error: string | null) => void;
}

const AudioEditor: React.FC<AudioEditorProps> = ({ audioFile, setIsProcessing, setProcessedUrls, setError }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<any>(null);
  const region = useRef<any>(null);
  const [volume, setVolume] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (waveformRef.current) {
      const ws = window.WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgb(203 213 225)',
        progressColor: 'rgb(45 212 191)',
        cursorColor: '#fff',
        barWidth: 3,
        barRadius: 3,
        barGap: 2,
        height: 150,
        url: URL.createObjectURL(audioFile),
      });

      const wsRegions = ws.registerPlugin(window.WaveSurfer.Regions.create());
      
      ws.on('ready', () => {
          region.current = wsRegions.addRegion({
            start: 0,
            end: ws.getDuration(),
            color: 'rgba(34, 197, 94, 0.2)',
            drag: true,
            resize: true,
          });
          setIsReady(true);
          
          // Style the waveform container for smooth scaling
          const waveContainer = ws.getWrapper();
          if (waveContainer) {
              waveContainer.style.transition = 'transform 0.1s ease-out';
              waveContainer.style.transformOrigin = 'center';
          }
      });

      ws.on('error', (err: any) => {
        setError(`Error loading audio: ${err.toString()}`);
      });

      wavesurfer.current = ws;
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioFile, setError]);

  // Effect to visually scale the waveform based on volume
  useEffect(() => {
    if (isReady && wavesurfer.current) {
      const waveContainer = wavesurfer.current.getWrapper();
      if (waveContainer) {
        waveContainer.style.transform = `scaleY(${volume})`;
      }
    }
  }, [volume, isReady]);


  const handlePlayPause = () => {
    if(wavesurfer.current) {
        wavesurfer.current.playPause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(newVolume);
    }
  };

  const handleProcess = async (format: 'wav' | 'mp3') => {
    if (!wavesurfer.current || !region.current) return;

    setIsProcessing(true);
    setProcessedUrls(prev => ({ ...prev, [format]: null }));
    setError(null);

    try {
      const audioBuffer = wavesurfer.current.getDecodedData();
      if (!audioBuffer) {
        throw new Error("Could not decode audio data.");
      }
      const blob = await processAudio(
        audioBuffer,
        region.current.start,
        region.current.end,
        volume,
        format
      );
      const url = URL.createObjectURL(blob);
      setProcessedUrls(prev => ({...prev, [format]: url}));

    } catch (err) {
        if (err instanceof Error) {
            setError(`Processing failed: ${err.message}`);
        } else {
            setError('An unknown processing error occurred.');
        }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div ref={waveformRef} className="w-full h-[150px] bg-slate-700/50 rounded-lg overflow-hidden"></div>
      
      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <div className="flex items-center gap-3">
            <button onClick={handlePlayPause} disabled={!isReady} className="p-3 bg-teal-500 rounded-full disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
            </button>
            <span className="text-slate-400 w-28">Playback / Pause</span>
        </div>

        <div className="flex-1 w-full flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            disabled={!isReady}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => handleProcess('wav')}
          disabled={!isReady}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed text-lg"
        >
          Export as WAV
        </button>
        <button
          onClick={() => handleProcess('mp3')}
          disabled={!isReady}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed text-lg"
        >
          Export as MP3
        </button>
      </div>
    </div>
  );
};

export default AudioEditor;