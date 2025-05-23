export class Scales {
    constructor() {
        this.audioContext = new AudioContext();
        this.synthInstance = null;
    }

    async init() {
        const { default: initializeWamHost } = await import("https://www.webaudiomodules.com/sdk/2.0.0-alpha.6/src/initializeWamHost.js");
        const [hostGroupId] = await initializeWamHost(this.audioContext);

        const { default: WAM } = await import('https://wam-4tt.pages.dev/Pro54/index.js');
        this.synthInstance = await WAM.createInstance(hostGroupId, this.audioContext);

        const state = await this.synthInstance.audioNode.getState();
        state.values.patchName = "Sync Harmonic";
        await this.synthInstance.audioNode.setState(state);

        this.synthInstance.audioNode.connect(this.audioContext.destination);
    }

    getSynthInstance() {
        return this.synthInstance;
    }

    resumeAudio() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    midiToNoteName(midiNumber) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNumber / 12) - 1;
        const note = notes[midiNumber % 12];
        return `${note}${octave}`;
    }

    generateScale(startNote, intervals) {
        const scale = [startNote];
        let currentNote = startNote;
        for (const interval of intervals) {
            currentNote += interval;
            scale.push(currentNote);
        }
        return scale.map(this.midiToNoteName);
    }

    majorScale(startNote) {
        return this.generateScale(startNote, [2, 2, 1, 2, 2, 2, 1]);
    }

    naturalMinorScale(startNote) {
        return this.generateScale(startNote, [2, 1, 2, 2, 1, 2, 2]);
    }

    harmonicMinorScale(startNote) {
        return this.generateScale(startNote, [2, 1, 2, 2, 1, 3, 1]);
    }

    melodicMinorScale(startNote) {
        return this.generateScale(startNote, [2, 1, 2, 2, 2, 2, 1]);
    }

    pentatonicMajorScale(startNote) {
        return this.generateScale(startNote, [2, 2, 3, 2, 3]);
    }

    pentatonicMinorScale(startNote) {
        return this.generateScale(startNote, [3, 2, 2, 3, 2]);
    }

    bluesScale(startNote) {
        return this.generateScale(startNote, [3, 2, 1, 1, 3, 2]);
    }

    chromaticScale(startNote) {
        return this.generateScale(startNote, Array(11).fill(1));
    }

    nameToMidi(noteName) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const match = noteName.match(/^([A-G]#?|[A-G]b?)(-?\d+)$/);
        if (!match) throw new Error(`Note invalide : ${noteName}`);

        const note = match[1];
        const octave = parseInt(match[2], 10);
        const noteIndex = notes.indexOf(note.replace('b', '#'));
        if (noteIndex === -1) throw new Error(`Note invalide : ${noteName}`);

        return noteIndex + (octave + 1) * 12;
    }

    scaleToMidi(scale) {
        if (!Array.isArray(scale)) throw new Error("La gamme doit être un tableau de noms de notes.");
        return scale.map(note => this.nameToMidi(note));
    }

    arpeggiator(scale, mode = "forward") {
        switch (mode) {
            case "forward": return scale;
            case "backward": return [...scale].reverse();
            case "alternate": return [...scale, ...scale.slice(0, -1).reverse()];
            case "random": return this.shuffle([...scale]);
            default: throw new Error("Mode invalide. Choisissez entre 'forward', 'backward', 'alternate', 'random'.");
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}