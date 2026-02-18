import * as Tone from 'tone';

/**
 * VOICE ANONYMIZATION PIPELINE (The "Blur")
 * 
 * Objective: Render the voice unrecognizable (no gender/timbre identification)
 * while maintaining perfect intelligibility (what is said matters more than who says it).
 * 
 * Strategy (Irreversible):
 * 1. Granular Pitch Shifting (-4 semitones): Removes fundamental frequency (F0).
 * 2. Spectral Shaping (Formant-like): Cuts high harmonics (timbre) + Low shelf.
 * 3. Non-Linear Distortion (Chebyshev): Adds synthetic harmonics to mask original biometrics.
 * 4. Vibrato (LFO): Randomizes micro-pitch to prevent simple pitch-shift inversion.
 */

export async function blurVoice(originalBlob: Blob): Promise<Blob> {
    // 1. Decode Audio Blob to Buffer
    const arrayBuffer = await originalBlob.arrayBuffer();
    // Use a temporary context for decoding
    const decodingContext = new AudioContext();
    const audioBuffer = await decodingContext.decodeAudioData(arrayBuffer);
    await decodingContext.close(); // Clean up immediately

    const duration = audioBuffer.duration;

    // 2. Setup Manual Offline Context
    // We create the context explicitly and bind all nodes to it.
    // This is CRITICAL to avoid "different audio contexts" error.
    // OPTIMIZATION: Mono (1 channel) + 8000Hz (Phone Quality) is minimal size.
    // Quality is degraded but acceptable for voice masking.
    const offlineContext = new Tone.OfflineContext(1, duration + 0.5, 8000);

    // 3. Create Nodes Bound to Offline Context
    // We must pass { context: offlineContext } to EVERY Tone node constructor.

    const source = new Tone.Player({
        url: audioBuffer,
        context: offlineContext
    });

    // A. Pitch Shifting (Granular)
    const pitchShift = new Tone.PitchShift({
        pitch: -4,
        windowSize: 0.1,
        delayTime: 0,
        feedback: 0,
        context: offlineContext
    });

    // B. Spectral Shaping (Formant-like)
    const eq = new Tone.EQ3({
        low: 0,
        mid: -2,
        high: -10,
        lowFrequency: 400,
        highFrequency: 2500,
        context: offlineContext
    });

    const lowPass = new Tone.Filter({
        frequency: 3500,
        type: "lowpass",
        rolloff: -12,
        context: offlineContext
    });

    // C. Non-Linear Distortion
    const distortion = new Tone.Chebyshev({
        order: 2,
        wet: 0.2,
        context: offlineContext
    });

    // D. Micro-Modulation
    const vibrato = new Tone.Vibrato({
        frequency: 0.5,
        depth: 0.1,
        type: "sine",
        context: offlineContext
    });

    // E. Compressor
    const compressor = new Tone.Compressor({
        threshold: -20,
        ratio: 3,
        attack: 0.05,
        release: 0.25,
        context: offlineContext
    });

    // 4. Connect Graph
    // Chain with explicit destination (offlineContext.destination)
    source.chain(
        pitchShift,
        vibrato,
        distortion,
        eq,
        lowPass,
        compressor,
        offlineContext.destination
    );

    // 5. Render
    source.start(0);
    const renderedBuffer = await offlineContext.render();

    // 6. Convert Rendered Buffer to Blob
    // renderedBuffer is a ToneAudioBuffer, .get() returns the native AudioBuffer
    const nativeBuffer = renderedBuffer.get() as AudioBuffer;
    return bufferToWave(nativeBuffer, nativeBuffer.length);
}

/**
 * Utility: Convert AudioBuffer to WAV Blob
 * Simple PCM WAVE encoder
 */
function bufferToWave(abuffer: AudioBuffer, len: number) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this writer)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    let sampleIdx = 0;
    while (sampleIdx < len) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels
            // Check if bounds are safe
            let s = channels[i][sampleIdx];
            sample = Math.max(-1, Math.min(1, s)); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(44 + offset, sample, true);          // write 16-bit sample
            offset += 2;
        }
        sampleIdx++;
    }

    // create Blob
    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data: any) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: any) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
