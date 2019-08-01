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
	document.getElementById('load').innerHTML = 'Play';
	$(".play").click(function(e){
	    e.preventDefault();
	    $(".intro").fadeOut();
	    startViz();
	    setTimeout(function() {
		  $(".intro").remove();
		}, 3000);
		setTimeout(function() {
			document.getElementById('prompt').innerHTML = 'Double click to toggle auto // Drag to explore';
			document.getElementById('clock').innerHTML = '<a href="http://mutualism.uk" target="blank">Mutualism</a>';
			document.getElementById('album').innerHTML = '<a href="https://mutualismuk.bandcamp.com/" target="blank">Thought Process</a> // <a href="https://github.com/joeqj" target="blank">Joe QJ</a>';
		},500);
	});
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
	analyser = audioContext.createAnalyser();
	analyser.smoothingTimeConstant = 0.1;
	source.connect(audioContext.destination);
	source.connect(analyser);
}

function startViz(){
	source.buffer = audioBuffer;
	source.loop = false;
	source.start(0.0);

	freqByteData = new Uint8Array(analyser.frequencyBinCount);
	levels = [];
	isPlayingAudio = true;
	
	clock.start();
}