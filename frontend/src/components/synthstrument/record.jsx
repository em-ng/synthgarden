import React from 'react';
// import { Link } from 'react-router-dom';
import * as Tone from 'tone';
import '../../assets/stylesheets/synthstrument.scss'
import start from '../../assets/images/start-rec.png'
import stop from '../../assets/images/stop-rec.png'

class Record extends React.Component {
    constructor(props) {
        super(props)
        const recorder = new Tone.Recorder()
        const synth = new Tone.Synth().connect(recorder);
        this.state = {
            recorder,
            recording: false,
            file: '',
            synth,
            sampleName: ''
        }
        synth.toDestination();
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        this.updateSampleName = this.updateSampleName.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleSubstring = this.handleSubstring.bind(this);
    }

    startRecording() {
    // TEST
    this.state.synth.triggerAttackRelease("C3", 0.5);
    this.state.synth.triggerAttackRelease("C4", 0.5, "+1");
    this.state.synth.triggerAttackRelease("C5", 0.5, "+2");
    // DELETE ABOVE

    this.state.recorder.start();
    this.setState({
      recording: true
    })
  }

  handleSubstring(substring) {
    this.setState({
        // url: clipUrl,
        file: substring,
        recording: false
      })
      console.log(this.state)
  }

   stopRecording() {
    let clip, substring, base64String;
    setTimeout(async () => {
      clip = await this.state.recorder.stop();
      var reader = new FileReader();
      reader.readAsDataURL(clip);
      reader.onloadend = () => {
        base64String = reader.result;    
        // print base64 encoded string,
        // without data attributes.
        substring = base64String.substr(base64String.indexOf(', ') + 1);
        this.handleSubstring(substring)
      }
      // debugger
      // console.log(substring)
    }, 500)
    
  }

  updateSampleName(e) {
    this.setState({
        sampleName: e.currentTarget.value
    })
  }

  handleSave() {
    let sampleData = {
        name: this.state.sampleName,
        user: this.props.currentUserId,
        file: this.state.file

    }
    this.props.saveSample(sampleData)
  }
    

  render() {
    let recordingButton;
    this.state.recording ?
      (
        recordingButton = <button
                            className="record-btn"
                            onClick={this.stopRecording}
                          >
                            <img src={stop} alt='stop-rec' className="rec-img" />
                          </button>
      ) : (
        recordingButton = <button
                            className="record-btn"
                            onClick={this.startRecording}
                          >
                            <img src={start} alt='start-rec' className="rec-img" />
                          </button>
      )

      let saveSample;
      this.state.file ?
      (
        saveSample = 
        <>
            <input
                type="text"
                value={this.state.sampleName}
                onChange={this.updateSampleName}
                placeholder="sample name"
            />
            <button onClick={this.handleSave}>Save Sample</button>
        </>
        // blob:http://localhost:3000/0ac0faca-0700-4267-bf8a-8b8cc5c70d61
      ) : (
        saveSample = null
      )

    return (
      <div className="record">
        <div>
            {recordingButton}
        </div>
        <audio src={this.state.url} controls></audio>
        {saveSample}
      </div>
    )
  }
}

export default Record;