var source;
var buffer;
var audioBuffer;
var dropArea;
var audioContext;
//var processor;
var analyser;
var freqByteData;
var levels;
var isPlayingAudio = false;
var normLevel =0;

//load sample MP3
function loadAudio() {

	source = audioContext.createBufferSource();
	analyser = audioContext.createAnalyser();
	analyser.fftSize = 1024;

	// Connect audio processing graph
	source.connect(analyser);
	analyser.connect(audioContext.destination);
	loadAudioBuffer("assets/mp3/reification.mp3");
}

function loadAudioBuffer(url) {
	// Load asynchronously
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.responseType = "arraybuffer";

	request.onload = function() {
		

		audioContext.decodeAudioData(request.response, function(buffer) {
				audioBuffer = buffer;
				finishLoad();
		 }, function(e) {
			console.log(e);
		});

	};

	request.send();
}

function finishLoad() {
	source.buffer = audioBuffer;
	source.loop = true;
	source.start(0.0);
	startViz();
}

function initAudio(data) {
	source = audioContext.createBufferSource();

	if(audioContext.decodeAudioData) {
		audioContext.decodeAudioData(data, function(buffer) {
			source.buffer = buffer;
			createAudio();
		}, function(e) {
			console.log(e);
		});
	} else {
		source.buffer = audioContext.createBuffer(data, false );
		createAudio();
	}
}

function createAudio() {
	//processor = audioContext.createJavaScriptNode(2048 , 1 , 1 );

	analyser = audioContext.createAnalyser();
	analyser.smoothingTimeConstant = 0.1;

	source.connect(audioContext.destination);
	source.connect(analyser);

	//analyser.connect(processor);
	//processor.connect(audioContext.destination);

	source.start(0);

	source.loop = true;

	startViz();
}

function startViz(){
	freqByteData = new Uint8Array(analyser.frequencyBinCount);
	levels = [];
	isPlayingAudio = true;
}