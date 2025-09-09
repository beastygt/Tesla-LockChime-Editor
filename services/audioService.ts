declare global {
    interface Window {
      lamejs: any;
    }
}
/**
 * Processes an AudioBuffer by trimming, adjusting volume, and converting to a specified format.
 */
export const processAudio = (
  originalBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  volume: number,
  outputFormat: 'wav' | 'mp3'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const trimmedBuffer = trimAudioBuffer(originalBuffer, startTime, endTime);
      const volumeAdjustedBuffer = adjustVolume(trimmedBuffer, volume);
      
      if (outputFormat === 'wav') {
        const wavBlob = encodeWAV(volumeAdjustedBuffer);
        resolve(wavBlob);
      } else if (outputFormat === 'mp3') {
        const mp3Blob = encodeMP3(volumeAdjustedBuffer);
        resolve(mp3Blob);
      } else {
        throw new Error('Unsupported output format');
      }

    } catch (error) {
      reject(error);
    }
  });
};


/**
 * Trims an AudioBuffer to the specified start and end times.
 */
function trimAudioBuffer(
  originalBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer {
  const sampleRate = originalBuffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const duration = endTime - startTime;
  const frameCount = Math.floor(duration * sampleRate);
  const numberOfChannels = originalBuffer.numberOfChannels;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const newBuffer = audioContext.createBuffer(numberOfChannels, frameCount, sampleRate);

  for (let i = 0; i < numberOfChannels; i++) {
    const channelData = originalBuffer.getChannelData(i);
    const newChannelData = newBuffer.getChannelData(i);
    newChannelData.set(channelData.subarray(startSample, endSample));
  }

  return newBuffer;
}

/**
 * Adjusts the volume of an AudioBuffer.
 */
function adjustVolume(
  originalBuffer: AudioBuffer,
  volume: number
): AudioBuffer {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        originalBuffer.length,
        originalBuffer.sampleRate
    );

    for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
        const originalChannelData = originalBuffer.getChannelData(i);
        const newChannelData = newBuffer.getChannelData(i);
        for(let j=0; j < originalChannelData.length; j++){
            newChannelData[j] = originalChannelData[j] * volume;
        }
    }
    return newBuffer;
}


/**
 * Encodes an AudioBuffer into a WAV file Blob.
 */
function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numberOfChannels === 2) {
    result = interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
  } else {
    result = audioBuffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
  view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // write the PCM data
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

/**
 * Encodes an AudioBuffer into a MP3 file Blob using lamejs.
 */
function encodeMP3(audioBuffer: AudioBuffer): Blob {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const kbps = 128; // or 192, 256, 320
  const mp3encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, kbps);
  
  const mp3Data = [];

  const samplesLeft = audioBuffer.getChannelData(0);
  const samplesRight = channels > 1 ? audioBuffer.getChannelData(1) : null;
  
  const sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

  // Function to convert float samples to 16-bit PCM
  const toPCM = (floatSample: number) => {
      const s = Math.max(-1, Math.min(1, floatSample));
      return s < 0 ? s * 0x8000 : s * 0x7FFF;
  };

  for (let i = 0; i < samplesLeft.length; i += sampleBlockSize) {
    const leftChunk = new Int16Array(sampleBlockSize);
    const rightChunk = channels > 1 ? new Int16Array(sampleBlockSize) : null;

    for (let j = 0; j < sampleBlockSize; j++) {
        if (i + j < samplesLeft.length) {
            leftChunk[j] = toPCM(samplesLeft[i + j]);
            if (samplesRight && rightChunk) {
                rightChunk[j] = toPCM(samplesRight[i + j]);
            }
        }
    }
    
    let mp3buf;
    if (channels > 1 && rightChunk) {
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
        mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf));
  }
  
  return new Blob(mp3Data, { type: 'audio/mpeg' });
}