import React from 'react';
import '../../assets/stylesheets/synthstrument.scss'

class Sample extends React.Component {
  constructor(props) {
    super(props);
    this.audio = ''
    this.state = {
      file: '',
      url: '',
      clip: '',
      sampleName: '',
      recording: false,
      updating: false,
      isPlaying: false
    };
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.updateSampleName = this.updateSampleName.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleSubstring = this.handleSubstring.bind(this);
    this.loadSample = this.loadSample.bind(this);
    this.b64toBlob = this.b64toBlob.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.playPause = this.playPause.bind(this);
  }

  startRecording() {
    if (this.props.loggedIn) {
      const spools = Array.from(document.querySelectorAll('.spool'));
      spools.forEach(spool => spool.classList.add('playing'));
      this.props.connectFX(this.props.recorder);
      this.props.recorder.start();
      this.setState({
        recording: true,
        updating: false,
        sampleName: '',
        url: '',
        file: ''
      });
    } else {
      this.props.openLogin();
    }
  }

  handleSubstring(base64String, clipUrl, clip) {
    this.setState({
        file: base64String,
        recording: false,
        url: clipUrl,
        clip
        // audio: new Audio(clipUrl)
      })
    this.audio = new Audio(clipUrl);
  }

   stopRecording() {
    let clip, clipUrl, base64String;
    const spools = Array.from(document.querySelectorAll('.spool'));
    spools.forEach(spool => spool.classList.remove('playing'));
    setTimeout(async () => {
      clip = await this.props.recorder.stop();  // BLOB
      clipUrl = URL.createObjectURL(clip)
      var reader = new FileReader();
      reader.readAsDataURL(clip);
      // debugger
      reader.onloadend = () => {
        base64String = reader.result;   
        this.handleSubstring(base64String, clipUrl, clip)
      }
    }, 500);
  }

  updateSampleName(e) {
    this.setState({ sampleName: e.currentTarget.value })
  }

  handleSave() {
    let isPlaying = this.state.isPlaying;
    if (isPlaying) {
      this.audio.pause();
      this.setState({ isPlaying: false })
    }
    
    if (this.state.clip.size > 10000000) {
        alert('This sample is too large, please record a new tune.')
    } else {
      let sampleData = {
          name: this.state.sampleName,
          user: this.props.currentUserId,
          file: this.state.file
      }
      this.props.saveSample(sampleData)
    }
  }

  handleUpdate() {
    let updatedSample = {
      name: this.state.sampleName,
      user: this.props.currentUserId,
      file: this.props.currentSample.file,
      _id: this.props.currentSample._id
    }
    this.props.updateSample(updatedSample)
  }

  handleDelete() {
    let isPlaying = this.state.isPlaying;
    if (isPlaying) {
      this.audio.pause();
      this.setState({ isPlaying: false })
    }
    this.setState({
      updating: false,
      sampleName: '',
    })
    this.props.deleteSample(this.props.currentSample._id)
  }

  componentDidUpdate(prevProps){
    if (this.props.currentSample !== prevProps.currentSample) {
      // console.log(this.state.name)
      this.loadSample();
      // console.log(this.state.name)
      this.setState({ updating: true })
    }
  }

  // stella gives TOTAL credit to stackoverflow - for this helper
  // https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
  b64toBlob (b64Data, contentType='audio/webm;codecs=opus', sliceSize=512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  loadSample() {
    let isPlaying = this.state.isPlaying;
    if (isPlaying) {
      this.audio.pause();
      this.setState({ isPlaying: false })
    }

    let b64str = this.props.currentSample.file.split(',')[1];
    // let audio = b64str.split(',')[1]
    // let contentType = 'audio/webm'
    // const blob = new Blob(b64str, {type: 'audio/webm;codecs=opus'});
    let blob = this.b64toBlob(b64str)
    const url = URL.createObjectURL(blob);
    this.setState({
      url,
      sampleName: this.props.currentSample.name,
    });
    this.audio = new Audio(url);
    // console.log(this.state.name)
  }

  playPause() {
    let isPlaying = this.state.isPlaying;
    if (isPlaying) {
      this.audio.pause();
      this.setState({ isPlaying: false })
    } else {
      this.setState({ isPlaying: true })
      this.audio.play();
      this.audio.loop = true;
    }
  }
    
  render() {
    let recordingButton;
    this.state.recording ?
      (
        recordingButton = <button
                            className="stop-record-btn"
                            onClick={this.stopRecording}
                          >
                            <div className="square"></div>
                          </button>
      ) : (
        recordingButton = <button
                            className="start-record-btn"
                            onClick={this.startRecording}
                          >
                            <div className="rec">REC.</div>
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
                onFocus={this.props.disableKeys} onBlur={this.props.enableKeys}
                placeholder="sample name"
            />
            <div className="save-download">
              <button onClick={this.handleSave} className="save-btn">Save</button>
              <div>
                <a href={this.state.url} download>Download</a>
              </div>
            </div>
        </>
      ) : (
        saveSample = null
      )

    let download;
    this.state.url ?
      (
        download = 
        <>
          {/* <audio src={this.state.url} autoPlay hidden loop></audio> */}
          <button className="play-btn" onClick={this.playPause}>
            {this.state.isPlaying ? 
            "PAUSE" : 
            "PLAY"}
          </button>
          {/* <a href={this.state.url} download>Download {this.state.name}</a> */}
        </>
      ) : (
        download = null
      )

    let edit;
    // eslint-disable-next-line no-unused-expressions
    this.state.updating ?
      (
        edit = 
          <>
            <input
              type="text"
              value={this.state.sampleName}
              onChange={this.updateSampleName}
              onFocus={this.props.disableKeys} onBlur={this.props.enableKeys}
              placeholder="sample name"
            />
            <div className="edit-btns">
              <button onClick={this.handleUpdate}>Update</button>
              <button onClick={this.handleDelete}>Delete</button>
            </div>
          </>,
          saveSample = <></>

      ) : (
        edit = null
      )

    return (
      <div className="sample off" id="recorder">
        {recordingButton}
        {download}
        {saveSample}
        {edit}
      </div>
    )
  }
}

export default Sample;