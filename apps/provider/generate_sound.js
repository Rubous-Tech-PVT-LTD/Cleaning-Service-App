const fs = require('fs');

// A simple 440Hz sine wave (beep) in WAV format (very short, 0.5s)
const sampleRate = 8000;
const duration = 0.5;
const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples);

// Write WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
buffer.writeUInt16LE(1, 22); // NumChannels (Mono)
buffer.writeUInt32LE(sampleRate, 24); // SampleRate
buffer.writeUInt32LE(sampleRate, 28); // ByteRate
buffer.writeUInt16LE(1, 32); // BlockAlign
buffer.writeUInt16LE(8, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples, 40);

// Write Audio Data
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  // Create a nice chime-like envelope
  const envelope = Math.exp(-t * 5);
  // Mix two frequencies for a "chime" sound (e.g., 880Hz and 1320Hz)
  let sample = (Math.sin(2 * Math.PI * 880 * t) + Math.sin(2 * Math.PI * 1320 * t)) * 0.5;
  sample *= envelope;
  
  const val = Math.max(0, Math.min(255, Math.floor((sample + 1) * 127.5)));
  buffer.writeUInt8(val, 44 + i);
}

if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
}

fs.writeFileSync('assets/notification.wav', buffer);
console.log('Created assets/notification.wav');
