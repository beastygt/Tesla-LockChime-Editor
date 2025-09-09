import React, { useState } from 'react';
import { findSounds, Sound } from '../services/soundSearchService';

interface SoundSearchProps {
    onSoundSelect: (sound: Sound) => void;
    setError: (error: string | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingText: (text: string) => void;
}

const SoundSearch: React.FC<SoundSearchProps> = ({ onSoundSelect, setError, setIsLoading, setLoadingText }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Sound[]>([]);
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            setError('Please enter a search term.');
            return;
        }
        
        setIsLoading(true);
        setLoadingText('Searching for sounds...');
        setError(null);
        setResults([]);
        
        try {
            const soundResults = await findSounds(query);
            if (soundResults.length === 0) {
                setError('No sounds found. Try a different search term.');
            }
            setResults(soundResults);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred during the search.');
            }
        } finally {
            setIsLoading(false);
            setLoadingText('Processing audio...');
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold text-center text-slate-300 mb-4">Find Sounds with AI</h2>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., a futuristic car door closing sound"
                    className="flex-grow bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                    aria-label="Sound search input"
                />
                <button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                    Search
                </button>
            </form>

            {results.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {results.map((sound, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                            <span className="text-slate-300 truncate" title={sound.name}>{sound.name}</span>
                            <button
                                onClick={() => onSoundSelect(sound)}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm flex-shrink-0"
                            >
                                Use This Sound
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SoundSearch;
