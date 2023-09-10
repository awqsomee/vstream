window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }

  // Global state
  let mediaRecorder; // MediaRecorder instance to capture footage
  const recordedChunks = [];

  // Buttons
  const videoElement = document.querySelector("video");

  const startBtn = document.getElementById("startBtn");
  startBtn.onclick = (e) => {
    mediaRecorder.start();
    startBtn.classList.add("is-danger");
    startBtn.innerText = "Recording";
  };

  const stopBtn = document.getElementById("stopBtn");
  stopBtn.onclick = (e) => {
    mediaRecorder.stop();
    startBtn.classList.remove("is-danger");
    startBtn.innerText = "Start";
  };

  const videoSelectBtn = document.getElementById("videoSelectBtn");
  videoSelectBtn.onclick = getVideoSources;

  const { ipcRenderer } = require("electron");

  // Get the available video sources
  async function getVideoSources() {
    ipcRenderer.send("show-video-options");
  }

  ipcRenderer.on("SET_SOURCE", async function selectSource(event, source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: source.id,
        },
      },
    };

    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorder
    const options = { mimeType: "video/webm; codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

    // Updates the UI
  });

  // Captures all recorded chunks
  function handleDataAvailable(e) {
    console.log("video data available");
    recordedChunks.push(e.data);
  }

  // Saves the video file on stop
  async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9",
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    ipcRenderer.send("open-save-dialog", buffer);
  }
});
