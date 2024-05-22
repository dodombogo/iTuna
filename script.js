document.addEventListener('DOMContentLoaded', function() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    const copyBtn = document.getElementById('copyBtn');
    const fileInput = document.getElementById('fileInput');
    const volumeSlider = document.getElementById('volumeSlider');
    const speedSlider = document.getElementById('speedSlider');
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    const transcriptArea = document.getElementById('transcriptArea');
    const visualizer = document.getElementById('visualizer');
    let audioElement;
    let isPlaying = false;
    let saveInterval;
    let audioContext;
    let analyser;
    let dataArray;
    let bufferLength;
    let source;
    let canvasCtx = visualizer.getContext('2d');

    fileInput.addEventListener('change', handleFileUpload);
    playPauseBtn.addEventListener('click', togglePlayPause);
    rewindBtn.addEventListener('click', rewind);
    forwardBtn.addEventListener('click', forward);
    saveBtn.addEventListener('click', saveTranscript);
    exportBtn.addEventListener('click', exportTranscript);
    copyBtn.addEventListener('click', copyTranscript);
    volumeSlider.addEventListener('input', updateVolume);
    speedSlider.addEventListener('input', updateSpeed);
    toggleThemeBtn.addEventListener('click', toggleTheme);
    transcriptArea.addEventListener('input', autoSave);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (audioElement) {
                audioElement.src = url;
            } else {
                audioElement = new Audio(url);
                setupAudioContext();
            }
            setupVisualizer();
        }
    }

    function setupAudioContext() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        source.connect(audioContext.destination);
    }

    function setupVisualizer() {
        if (audioElement) {
            drawVisualizer();
        }
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'rgba(30, 30, 30, 0.5)';
        canvasCtx.fillRect(0, 0, visualizer.width, visualizer.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#4caf50';
        canvasCtx.beginPath();
        let sliceWidth = visualizer.width * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * visualizer.height / 2;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.lineTo(visualizer.width, visualizer.height / 2);
        canvasCtx.stroke();
    }

    function togglePlayPause() {
        if (audioElement) {
            if (isPlaying) {
                audioElement.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                audioElement.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
            isPlaying = !isPlaying;
        }
    }

    function rewind() {
        if (audioElement) {
            audioElement.currentTime -= 5;
        }
    }

    function forward() {
        if (audioElement) {
            audioElement.currentTime += 5;
        }
    }

    function saveTranscript() {
        const transcript = transcriptArea.value;
        localStorage.setItem('transcript', transcript);
    }

    function exportTranscript() {
        const transcript = transcriptArea.value;
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transcript.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    function copyTranscript() {
        transcriptArea.select();
        document.execCommand('copy');
    }

    function updateVolume() {
        if (audioElement) {
            audioElement.volume = volumeSlider.value;
        }
    }

    function updateSpeed() {
        if (audioElement) {
            audioElement.playbackRate = speedSlider.value;
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
    }

    function autoSave() {
        clearInterval(saveInterval);
        saveInterval = setInterval(saveTranscript, 5000);
    }

    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'Escape':
                togglePlayPause();
                break;
            case 'F1':
                rewind();
                break;
            case 'F2':
                forward();
                break;
            case 's':
                if (event.ctrlKey) {
                    event.preventDefault();
                    saveTranscript();
                }
                break;
        }
    });
});
