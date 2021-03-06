/*
♡ BROWSER SYNTH INSTRUMENT ♡
*/
import * as Tone from 'tone';
import Oscillator1 from './osc_1';
// import Oscillator2 from './osc_2';
import React from 'react'
import '../../assets/stylesheets/synthstrument.scss';
import FXBank from './fx_bank';
import Sample from './sample';
import PatchControlsContainer from './patch_controls_container';
import Tape from './tape';
import PatchedRecorder from './recording.js';
import Scope from "./oscilloscope";


class Synthstrument extends React.Component{

    constructor(props){
        super(props);
        const eq3 = new Tone.EQ3().toDestination();
        const recorder = new PatchedRecorder();
        const simpleSynth = new Tone.Synth().connect(eq3);
        const oscillator1 = simpleSynth.oscillator;
        const envelope = simpleSynth.envelope;
        const chorus = new Tone.Chorus();
        const tremolo = new Tone.Tremolo();
        const distortion = new Tone.Distortion();
        const bitCrush = new Tone.BitCrusher();
        const feedDelay = new Tone.FeedbackDelay();
        const pongDelay = new Tone.PingPongDelay();
        simpleSynth.volume.value = -20;
        oscillator1.type = 'pwm';
        envelope.attackCurve = "linear";
        envelope.attack = .2;
        const pitches = {a: 'C4', w: 'C#4', s: 'D4', e: 'D#4', d: 'E4', f: 'F4',
            t: 'F#4', g: 'G4', y: 'G#4', h: 'A4', u: 'A#4', j: 'B4', k: 'C5'}
        this.signalChain = [];
        this.state = {
            contextStarted: 'false',
            synth1: simpleSynth,
            currentPatch: this.props.currentPatch,
            pitches,
            octave: 0,
            envelope,
            eq3,
            oscillator1,
            chorus,
            tremolo,
            distortion,
            bitCrush,
            feedDelay,
            pongDelay,
            patchName: '',
            currentName: 'no patch selected',
            recorder,
            lastLink: eq3
        }
        this.instantiateAudioContext = this.instantiateAudioContext.bind(this);
        this.updatePatchName = this.updatePatchName.bind(this);
        this.pressKey = this.pressKey.bind(this);
        this.releaseKey = this.releaseKey.bind(this);
        this.disableKeys = this.disableKeys.bind(this);
        this.enableKeys = this.enableKeys.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.updatePatch = this.updatePatch.bind(this);
        this.changeOctave = this.changeOctave.bind(this);
        this.connectFX = this.connectFX.bind(this);
        this.disconnectFX = this.disconnectFX.bind(this);
        this.savePatch = this.savePatch.bind(this);
        this.loadPatch = this.loadPatch.bind(this);
    }

    // UPDATE SELECTED PATCH
    componentDidUpdate(prevProps){
        if (this.props.currentPatch !== prevProps.currentPatch) {
            this.loadPatch();
        }
        if (this.props.currentUserId !== prevProps.currentUserId) {
            this.props.resetSynthDefaults();
            document.getElementById('loaded-patch-CRUD').className = "hidden";
            document.getElementById('new-patch-CRUD').className = "visible";
            document.getElementById('new-patch-toggle').className = "hidden";
        }
    }

    setVolume(e){
        this.state.synth1.volume.value = e.target.value;
        this.setState({
            synth1: this.state.synth1
        })
    }

    instantiateAudioContext(e){
        if (this.state.contextStarted === 'false') {
            Tone.start().then(() => {
                this.state.oscillator1.start();
            }).then(() => {
                document.addEventListener("keydown", this.pressKey);
                document.addEventListener("keyup", this.releaseKey);
            });
            this.setState({
                contextStarted: 'true'
            })
            e.target.className = 'power-button on';
            document.getElementById('eq').classList.remove('off');
            document.getElementById('recorder').classList.remove('off');
            document.querySelectorAll('.oct-up, .oct-down').forEach (el => el.classList.remove('off'));
            document.querySelector('.env-controls').classList.remove('off');
            document.querySelector('.volume').classList.remove('off');
        } else {
            this.state.oscillator1.stop();
            e.target.className = 'power-button off';
            document.getElementById('eq').classList.add('off');
            document.getElementById('recorder').classList.add('off');
            document.querySelectorAll('.oct-up, .oct-down').forEach (el => el.classList.add('off'));
            document.querySelector('.env-controls').classList.add('off');
            document.querySelector('.volume').classList.add('off');
            this.setState({
                contextStarted: 'false'
            })
        }
    }

    //  KEY CONTROLLER HANDLERS
    pressKey(e){
        if (e.type === 'keydown' && !(e.key in this.state.pitches)) return null;
        let pitch; 
        if (e.type === 'mousedown') {
            pitch = e.target.id;
        } else {
            pitch = this.state.pitches[e.key];
        }
        this.state.oscillator1.frequency.value = pitch;
        this.state.envelope.triggerAttack();
        document.getElementById(pitch).className = 'active';
    }
    
    releaseKey(e){
        if (e.type === 'keyup' && !(e.key in this.state.pitches)) return null;
        let pitch;
        if (e.type === 'mouseup') {
            pitch = e.target.id;
        } else {
            pitch = this.state.pitches[e.key];
        }
        this.state.envelope.triggerRelease();
        document.getElementById(pitch).className = 'key';
    }

    disableKeys(){
        document.removeEventListener('keydown', this.pressKey);
        document.removeEventListener('keyup', this.releaseKey);
    }

    enableKeys(){
        document.addEventListener('keydown', this.pressKey);
        document.addEventListener('keyup', this.releaseKey);
    }

    // PATCH CONTROLS
    updatePatchName(e){
        this.setState({
            patchName: e.target.value,
            currentName: e.target.value
        })
        document.getElementById('loaded-patch-CRUD').className = "hidden";
    }

    savePatch(saveType){
        const modsOn = document.getElementById('mods').className === 'mods on';
        const harmonicsOn = document.getElementById('distortion').className === 'harmonics on';
        const delaysOn = document.getElementById('delay').className === 'delays on';
        const signalChain = this.signalChain.map(node => node.name).join('/');
        let selectedDelay;
        let selectedHarmonics;
        document.getElementById('distortion-controls').className === 'distortion visible' ? selectedHarmonics = 'distortion' : selectedHarmonics = 'bitcrush';
        document.getElementById('feedback-controls').className === 'feedback-delay visible' ? selectedDelay = 'feedback' : selectedDelay = 'pong';

        const patchData = {
            name: this.state.patchName,
            user: this.props.currentUserId,
            oscillator: {
                osctype: this.state.oscillator1.type,
                attack: this.state.envelope['attack'],
                sustain: this.state.envelope['sustain'],
                release: this.state.envelope['release'],
            },
            octave: this.state.octave,
            eq: {
                high: this.state.eq3.high.value,
                mid: this.state.eq3.mid.value,
                low: this.state.eq3.low.value
            },
            mods: modsOn,
            chorus: {
                LFO: this.state.chorus.frequency.value,
                delay: this.state.chorus.delayTime,
                depth: this.state.chorus.depth
            },
            tremolo: {
                frequency: this.state.tremolo.frequency.value,
                depth: this.state.tremolo.depth.value
            },
            harmonics: harmonicsOn,
            selectedHarmonics,
            distortion: {
                amt: this.state.distortion.wet.value
            },
            bitCrusher: {
                bitDepth: this.state.bitCrush.bits.value,
                amount: this.state.bitCrush.wet.value
            },
            delay: delaysOn,
            selectedDelay,
            feedback: {
                time: this.state.feedDelay.delayTime.value,
                fb: this.state.feedDelay.feedback.value,
                amt: this.state.feedDelay.wet.value
            },
            pingPong: {
                time: this.state.pongDelay.delayTime.value,
                fb: this.state.pongDelay.feedback.value,
                amt: this.state.pongDelay.wet.value
            },
            signalChain
        }
        if (saveType === 'new') {
            this.props.savePatch(patchData);
            this.props.resetSynthDefaults();
            
        } else {
            patchData.id = this.state.currentPatch._id;
            patchData.name = this.state.currentPatch.name;
            this.props.saveUpdatedPatch(patchData);
        }
    }
    // ASSIGN NEW NODE SETTINGS AND SET STATE
    loadPatch(){
        const currentState = this.state;
        const currentPatch = this.props.currentPatch;
        currentState.oscillator1.type = currentPatch.oscillator.osctype;
        currentState.envelope['attack'] = currentPatch.oscillator.attack;
        currentState.envelope['sustain'] = currentPatch.oscillator.sustain;
        currentState.envelope['release'] = currentPatch.oscillator.release;
        currentState.eq3.high.value = currentPatch.eq.high;
        currentState.eq3.mid.value = currentPatch.eq.mid;
        currentState.eq3.low.value = currentPatch.eq.low;
        currentState.chorus.frequency.value = currentPatch.chorus.LFO;
        currentState.chorus.delayTime = currentPatch.chorus.delay;
        currentState.chorus.depth = currentPatch.chorus.depth;
        currentState.tremolo.frequency.value = currentPatch.tremolo.frequency;
        currentState.tremolo.depth.value = currentPatch.tremolo.depth;
        currentState.distortion.wet.value = currentPatch.distortion.amt; 
        currentState.bitCrush.bits.value = currentPatch.bitCrusher.bitDepth;
        currentState.bitCrush.wet.value = currentPatch.bitCrusher.amount;
        currentState.feedDelay.delayTime.value = currentPatch.feedback.time;
        currentState.feedDelay.feedback.value = currentPatch.feedback.fb;
        currentState.feedDelay.wet.value = currentPatch.feedback.amt;
        currentState.pongDelay.delayTime.value = currentPatch.pingPong.time;
        currentState.pongDelay.feedback.value = currentPatch.pingPong.fb;
        currentState.pongDelay.wet.value = currentPatch.pingPong.amt;
        const newSignalChain = [];
        const availableEffects = {
            Chorus: currentState.chorus, Tremolo: currentState.tremolo, Distortion: currentState.distortion, BitCrusher: currentState.bitCrush,
            FeedbackDelay: currentState.feedDelay, PingPongDelay: currentState.pongDelay
        }
        const activeEffectsNames = currentPatch.signalChain.split('/');
        if (Boolean(activeEffectsNames[0])) {
                activeEffectsNames.forEach (nodeName => {
                    newSignalChain.push(availableEffects[nodeName]);
            });
        }
        if (this.signalChain.length > 0) {
            this.signalChain.forEach (node => this.disconnectFX(node));
        }
        if (newSignalChain.length > 0) {
            newSignalChain.forEach (node => this.connectFX(node));
        }
        this.signalChain = newSignalChain;
        document.getElementById('harmonics-selector').value = currentPatch.selectedHarmonics;
        document.getElementById('delays-selector').value = currentPatch.selectedDelay;
        this.setState({
            currentPatch: currentPatch,
            currentName: currentPatch.name,
            oscillator1: currentState.oscillator1,
            envelope: currentState.envelope,
            eq3: currentState.eq3, 
            chorus: currentState.chorus, 
            tremolo: currentState.tremolo, 
            distortion: currentState.distortion, 
            bitCrush: currentState.bitCrush, 
            feedDelay: currentState.feedDelay, 
            pongDelay: currentState.pongDelay
        })
        this.changeOctave(null, currentPatch.octave);
        const modSwitch = document.getElementById('mods-controller');
        const harmonicSwitch = document.getElementById('harmonics-controller');
        const delaySwitch = document.getElementById('delays-controller');
        const modsPanel = document.getElementById('mods');
        const harmonicsPanel = document.getElementById('distortion');
        const delayPanel = document.getElementById('delay');
        if (currentPatch.mods) {
            modSwitch.checked = true;
            modSwitch.className = 'switch on';
            modsPanel.className = 'mods on';
        } else {
            modSwitch.checked = false;
            modSwitch.className = 'switch off';
            modsPanel.className = 'mods off';
        } 
        if (currentPatch.harmonics) {
            harmonicSwitch.checked = true;
            harmonicSwitch.className = 'switch on';
            harmonicsPanel.className = 'harmonics on';
        } else {
            harmonicSwitch.checked = false;
            harmonicSwitch.className = 'switch off';
            harmonicsPanel.className = 'harmonics off';
        }
        if (currentPatch.delay) {
            delaySwitch.checked = true;
            delaySwitch.className = 'switch on';
            delayPanel.className = 'delays on';
        } else {
            delaySwitch.checked = false;
            delaySwitch.className = 'switch off';
            delayPanel.className = 'delays off';
        }
        if (this.props.currentPatch.name !== 'no patch selected') {
            document.getElementById('loaded-patch-CRUD').className = "visible";
            document.getElementById('new-patch-CRUD').className = "hidden";
            document.getElementById('new-patch-toggle').className = "visible";
        }
    }

    // SYNTH SETTINGS CHANGE TREE
    updatePatch(type){
        return e => {
            switch (type) {
                case 'attack':
                case 'sustain':
                case 'release':
                    const updateEnv = this.state.envelope;
                    updateEnv[type] = e.target.value;
                    this.setState({
                        envelope: updateEnv
                    })
                    break;
                case 'eq':
                    switch (e.target.className) {
                        case 'low':
                            this.state.eq3.low.value = e.target.value;
                            break;
                        case 'mid':
                            this.state.eq3.mid.value = e.target.value;
                            break;
                        case 'high':
                            this.state.eq3.high.value = e.target.value;
                            break;
                    }
                    this.setState({
                        eq3: this.state.eq3
                    })
                    break;   
                case 'chorus':
                    switch (e.target.className) {
                        case 'LFO':
                            this.state.chorus.frequency.value = e.target.value;
                            break;
                        case 'delay':
                            this.state.chorus.delayTime = e.target.value;
                            break;
                        case 'chorus-depth':
                            this.state.chorus.depth = e.target.value;
                            break;
                    }
                    this.setState({
                        chorus: this.state.chorus
                    })
                case 'tremolo':
                    switch (e.target.className) {
                        case 'frequency':
                            this.state.tremolo.frequency.value = e.target.value;
                            break;
                        case 'trem-depth':
                            this.state.tremolo.depth.value = e.target.value;
                            break;
                    }     
                    this.setState({
                        tremolo: this.state.tremolo
                    })
                    break;
                case 'distortion':
                    this.state.distortion.distortion = e.target.value;
                    this.setState({
                        distortion: this.state.distortion
                    })
                    break;
                case 'bitcrush':
                    if (e.target.className === 'crusher-wet') {
                        this.state.bitCrush.wet.value = e.target.value;
                    } else {
                        this.state.bitCrush.bits.value = e.target.value;
                    }
                    this.setState({
                        bitCrush: this.state.bitCrush
                    })
                    break;
                case 'feedback-delay':
                    switch (e.target.className) {
                        case 'delay-time':
                            this.state.feedDelay.delayTime.value = e.target.value;
                            break;
                        case 'feedback':
                            this.state.feedDelay.feedback.value = e.target.value;
                            break;
                        case 'wet-dry':
                            this.state.feedDelay.wet.value = e.target.value;
                            break;
                    }
                    this.setState({
                        feedDelay: this.state.feedDelay
                    })
                    break;
                case 'pong-delay':
                    switch (e.target.className) {
                        case 'delay-time':
                            this.state.pongDelay.delayTime.value = e.target.value;
                            break;
                        case 'feedback':
                            this.state.pongDelay.feedback.value = e.target.value;
                            break;
                        case 'wet-dry':
                            this.state.pongDelay.wet.value = e.target.value;
                            break;
                    }
                    this.setState({
                        pongDelay: this.state.pongDelay
                    })
                    break;
            }
        }
    }

    changeOctave(e, patchOct){
        let octMod;
        if (e && (e.target.className === 'oct-up off' || e.target.className === 'oct-down off')) return null;
        if (e) e.target.className === 'oct-up' ? octMod = 1 : octMod = -1;
        if (patchOct || patchOct === 0) octMod = (patchOct - this.state.octave);
        const letters = Object.keys(this.state.pitches);
        const newPitches = {};
        const origPitches = Object.values(this.state.pitches);
        if (this.state.octave + octMod <= 3 && this.state.octave + octMod >= -3) {
            origPitches.forEach ((pitch, idx) => {
                const pitchLetter = pitch.slice(0, -1);
                const newOct = parseInt(pitch.slice(-1)) + octMod;
                newPitches[letters[idx]] = pitchLetter + newOct;
            });
            this.setState({
                pitches: newPitches,
                octave: (this.state.octave + octMod)
            })
        }
    }

    // CONNECT AND DISCONNECT EFFECTS NODES
    connectFX(effectNode){
        const destination = Tone.getDestination();
        let prevLastNode;
        this.signalChain.length === 0 ? prevLastNode = this.state.eq3 : prevLastNode = this.signalChain.slice(-1)[0];
        
        if (effectNode.name !== 'Recorder') {
            prevLastNode.disconnect(destination);
            prevLastNode.chain(effectNode, destination);
            this.signalChain.push(effectNode);
            this.setState({lastLink: effectNode});
        } else {
            prevLastNode.connect(effectNode);
        }
    }

    disconnectFX(effectNode){
        const destination = Tone.getDestination();
        if (this.signalChain.length === 1) {
            effectNode.disconnect(destination);
            this.signalChain = [];
            this.state.eq3.connect(destination);
            this.setState({lastLink: this.state.eq3});
        } else {
            this.signalChain.forEach (node => node.disconnect());
            const idx = this.signalChain.indexOf(effectNode);
            const newChain = this.signalChain.slice(0, idx).concat(this.signalChain.slice(idx + 1));
            this.state.eq3.chain(...newChain, destination);
            this.signalChain = newChain;
            this.setState({lastLink: newChain.slice(-1)[0]});
        }
    }

    render(){
        return (
            <div className="synthstrument-container">
                <div className="synthstrument">
                    <div className="synth-toolbar">
                        <button className="power-button off" onClick={this.instantiateAudioContext}>
                                POWER
                        </button>
                        < PatchControlsContainer 
                            patchName={this.state.patchName} 
                            currentName={this.state.currentName}
                            updatePatchName={this.updatePatchName}
                            savePatch={this.savePatch}
                            disableKeys={this.disableKeys}
                            enableKeys={this.enableKeys}
                        />
                    </div>
                    <div className="main-controls box">
                        <div className="main-synth-box">
                            <div className="oscillators-bar">
                                <div className="osc-box">
                                    <Oscillator1 oscillator={this.state.oscillator1}/>
                                    <div className="env-controls off">
                                        <h4>Envelope</h4>
                                        <label>
                                            Attack
                                            <input type="range" value={this.state.envelope.attack} max="2" step=".01" onChange={this.updatePatch('attack')}/>
                                        </label>
                                        <label>
                                            Sustain
                                            <input type="range" value={this.state.envelope.sustain} max="1" step=".05" onChange={this.updatePatch('sustain')}/>
                                        </label>
                                        <label>
                                            Release
                                            <input type="range" value={this.state.envelope.release} max="5" step=".05" onChange={this.updatePatch('release')}/>
                                        </label>
                                    </div>
                                    <div className="octave-shift" onClick={this.changeOctave}>
                                        <button className="oct-up off">
                                            Oct. Up
                                        </button>
                                        <button className="oct-down off">
                                            Oct. Down
                                        </button>
                                    </div>
                                    <Sample
                                        connectFX={this.connectFX}
                                        disconnectFX={this.disconnectFX}
                                        currentUserId={this.props.currentUserId}
                                        loadSample={this.props.loadSample}
                                        currentSample={this.props.currentSample}
                                        saveSample={this.props.saveSample}
                                        updateSample={this.props.updateSample}
                                        deleteSample={this.props.deleteSample}
                                        recorder={this.state.recorder}
                                        disableKeys={this.disableKeys}
                                        enableKeys={this.enableKeys}
                                        className="sample"
                                        loggedIn={this.props.loggedIn}
                                        openLogin={this.props.openLogin}
                                    />
                                    < Tape /> 
                                </div>
                                <div className="post-FX">
                                        <div className="eq3 off" id="eq">
                                            <label>
                                                Low
                                                <input type="range" value={this.state.eq3.low.value} 
                                                    min="-12" 
                                                    max="12" 
                                                    step=".5" 
                                                    onChange={this.updatePatch('eq')} 
                                                    className="low" />
                                            </label>
                                            <label>
                                                Mid
                                                <input type="range" value={this.state.eq3.mid.value} 
                                                    min="-12" 
                                                    max="12" 
                                                    step=".5" 
                                                    onChange={this.updatePatch('eq')} 
                                                    className="mid" />
                                            </label>
                                            <label>
                                                High
                                                <input type="range" value={this.state.eq3.high.value} 
                                                    min="-12" 
                                                    max="12" 
                                                    step=".5" 
                                                    onChange={this.updatePatch('eq')} 
                                                    className="high" />
                                            </label>
                                        </div>
                                        < FXBank connectFX={this.connectFX} disconnectFX={this.disconnectFX} updatePatch={this.updatePatch}
                                            chorusNode={this.state.chorus}
                                            tremoloNode={this.state.tremolo}
                                            distortNode={this.state.distortion}
                                            crushNode={this.state.bitCrush}
                                            feedDelayNode={this.state.feedDelay}
                                            pongDelayNode={this.state.pongDelay}
                                        />
                                        < Scope contextStarted={this.state.contextStarted} lastLink={this.state.lastLink}/>
                                </div>
                            </div>
                            <div className="keys-bar">
                                <ol className="keyboard omni" onMouseDown={this.pressKey} onMouseUp={this.releaseKey}>
                                    {Object.values(this.state.pitches).map ((note, idx) => (
                                        <li className="key" key={idx} id={note}>
                                            {Object.keys(this.state.pitches)[idx]}
                                            <p>
                                            {note}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                                <div className="volume off" onClick={this.setVolume}>
                                    <label className="volume-label omni">Volume
                                        <input type="range" value={this.state.synth1.volume.value} onChange={this.setVolume} min="-60" max="0" step="1" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Synthstrument;