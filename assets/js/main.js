var BEAT_HOLD_TIME = 60; //num of frames to hold a beat
var BEAT_DECAY_RATE = 0.97;
var BEAT_MIN = 0.6; //level less than this is no beat

var camera, scene, renderer, composer, materials = [], simpleMeshCount = 2000;
var totalFaces = 0;
var lineSphere;
var particles;
var clearArray = [];
var clock;
var object, light;
var beatCutOff = 20;
var beatTime = 0; //avoid auto beat at start
var geometry;
var lineSphere;
var renderScene;
var glitchPass;

var width = window.innerWidth;
var height = window.innerHeight;

var rtParameters = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	format: THREE.RGBFormat,
	stencilBuffer: true
};

init();
animate();
loadReification();
function init() {
	clock = new THREE.Clock();
	clock.start();

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;
	document.body.appendChild( renderer.domElement );

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 500;

	controls = new THREE.OrbitControls( camera );
	controls.target.set( 0, 0, 0 );
	controls.enableZoom = false;
	controls.enablePan = false;
	controls.update();

	scene = new THREE.Scene();
	scene2 = new THREE.Scene();
	sceneSphere = new THREE.Scene();

	// Reification Orb 1
	orb1 = new THREE.Object3D();
	createJSON('assets/json/reificationorb.json', orb1, 0xffffff, 150, 100, 100);
	createJSON('assets/json/reificationorbcentre.json', orb1, 0x000000, 150, 100, 100);

	// Reification Orb 2
	orb2 = new THREE.Object3D();
	createJSON('assets/json/reificationorb.json', orb2, 0xffffff, -150, 100, 100);
	createJSON('assets/json/reificationorbcentre.json', orb2, 0x000000, -150, 100, 100);
	
	scene.add( new THREE.AmbientLight( 0x222222 ) );
	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 );
	scene.add( light );

	// Sprites
	geometry = new THREE.Geometry();
	for ( i = 0; i < 200; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * 2000 - 1000;
		vertex.y = Math.random() * 2000 - 1000;
		vertex.z = Math.random() * 2000 - 1000;
		geometry.vertices.push( vertex );
	}
	parameters = [
		[ [1, 1, 0.5], 5 ],
		[ [0.95, 1, 0.5], 4 ],
		[ [0.90, 1, 0.5], 3 ],
		[ [0.85, 1, 0.5], 2 ],
		[ [0.80, 1, 0.5], 1 ]
	];
	for ( i = 0; i < parameters.length; i ++ ) {
		size  = parameters[i][1];
		materials[i] = new THREE.PointsMaterial( { size: size } );
		particles = new THREE.Points( geometry, materials[i] );
		particles.rotation.x = Math.random() * 6;
		particles.rotation.y = Math.random() * 6;
		particles.rotation.z = Math.random() * 6;
		scene2.add( particles );
	}

	postProcessing();

	//Get an Audio Context
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		audioContext = new window.AudioContext();
	} catch(e) {
		//Web Audio API is not supported in this browser
		alert("Sorry! This browser does not support the Web Audio API. Please use Chrome, Safari or Firefox.");
	}

	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	composer.setSize( window.innerWidth, window.innerHeight );
	composer2.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame(animate);
	render();
	//stats.update();
}

function createJSON(json, name, colour, posx, posy, posz) {
	
	scene.add( name );

	var loader = new THREE.JSONLoader();
	loader.load( json, function ( geometry ) {
        var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: colour, opacity: 1 } ) );
        mesh.position.x = posx;
        mesh.position.y = posy;
        mesh.position.z = posz;
        name.add( mesh );
	}); 
};

function createLineCube() {
	colourfuck = 2.5;
	increment = 0.5
	var geometry = new THREE.Geometry(),
		points = hilbert3D( new THREE.Vector3( 0,0,0 ), 200.0, 2, 0, 1, Math.floor(Math.random() * 7) + 1, 2, 4, Math.floor(Math.random() * 7) + 1, 6, 7 ),
		colors = [];

	for ( i = 0; i < points.length; i ++ ) {
		geometry.vertices.push( points[ i ] );
		colors[ i ] = new THREE.Color( 0xffffff );
		colors[ i ].setHSL( colourfuck -= increment, 0.1, Math.max( 0, ( 200 + points[ i ].x ) / 200 ) * 0.5 );
	}
	geometry.colors = colors;
	// lines
	material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors });
	var line, p, scale = 2.5, d = 0;
	var parameters =  [ [ material, scale * 1.5, [0,0,0],  geometry ] ];
	for (i = 0; i < parameters.length; ++i) {
		p = parameters[ i ];
		line = new THREE.Line( p[ 3 ],  p [0]);
		line.scale.x = line.scale.y = line.scale.z =  p[ 1 ];
		line.position.x = p[ 2 ][ 2 ];
		line.position.y = p[ 2 ][ 1 ];
		line.position.z = p[ 2 ][ 2 ];
		scene.add( line );
	}
};

function createLineSpheres() {
	var i, vertex1, vertex2, material, p,
		parameters = [  [ 0.5, 0x87daff, 1, 1 ],  [ 1.2, 0x8e87ff, 0.5, 1 ], [ 1.25, 0x000833, 0.8, 1 ],
				       [ 3.0, 0xaaaaaa, 0.75, 2 ], [ 3.5, 0xffffff, 0.5, 1 ], [ 4.5, 0xffffff, 0.25, 1 ], [ 5.5, 0xffffff, 0.125, 1 ] ];
	var geometry = createGeometry();
	for( i = 0; i < parameters.length; ++ i ) {
		p = parameters[ i ];
		material = new THREE.LineBasicMaterial( { color: p[ 1 ], opacity: p[ 2 ], linewidth: p[ 3 ] } );
		lineSphere = new THREE.LineSegments( geometry, material );
		lineSphere.scale.x = lineSphere.scale.y = lineSphere.scale.z = p[ 0 ];
		lineSphere.originalScale = p[ 2 ];
		lineSphere.rotation.y = Math.random() * Math.PI;
		lineSphere.updateMatrix();
		scene.add( lineSphere );
	}
};

function createGeometry() {
	var geometry = new THREE.Geometry();
	var r = 250;
	for ( i = 0; i < 1500; i ++ ) {
		var vertex1 = new THREE.Vector3();
		vertex1.x = Math.random() * 3 - 1;
		vertex1.y = Math.random() * 5 - 1;
		vertex1.z = Math.random() * 1 - 1;
		vertex1.normalize();
		vertex1.multiplyScalar( r );
		vertex2 = vertex1.clone();
		vertex2.multiplyScalar( Math.random() * 0.04 + 1 );
		geometry.vertices.push( vertex1 );
		geometry.vertices.push( vertex2 );
	}
	return geometry;
}

function updateAudio(){

	if (!isPlayingAudio)return;
	analyser.getByteFrequencyData(freqByteData);

	var length = freqByteData.length;

	//GET AVG LEVEL
	var sum = 0;
	for(var j = 0; j < length; ++j) {
		sum += freqByteData[j];
	}

	// Calculate the average frequency of the samples in the bin
	var aveLevel = sum / length;

	normLevel = (aveLevel / 256) * 2.5; //256 is the highest a freq data can be

	//BEAT DETECTION
	if (normLevel  > beatCutOff && normLevel > BEAT_MIN){
		beatCutOff = normLevel *1.1;
		beatTime = 0;
	}else{
		if (beatTime < BEAT_HOLD_TIME){
			beatTime ++;
		}else{
			beatCutOff *= BEAT_DECAY_RATE;
		}
	}
}

function loadReification(){
	//load MP3
	loadAudio();
}

function postProcessing2() {
	// postprocessing
	var clearMask = new THREE.ClearMaskPass();
	composer = new THREE.EffectComposer( renderer );
	composer.addPass( new THREE.RenderPass( scene, camera ) );
	var glitchPass = new THREE.GlitchPass();
	glitchPass.renderToScreen = true;
	
	//composer.addPass( glitchPass );
	//composer.addPass( clearMask );

	var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
	effect.uniforms[ 'amount' ].value = 0.0015;
	effect.renderToScreen = true;
	composer.addPass( effect );
	composer.addPass( clearMask );
}

function postProcessing() {
	composer = new THREE.EffectComposer(renderer);
	composer.addPass(new THREE.RenderPass(scene, camera));

	
	
	kaleidoPass = new THREE.ShaderPass(THREE.KaleidoShader);
	kaleidoPass.renderToScreen = false;
	//composer.addPass(kaleidoPass);

	glitchPass = new THREE.GlitchPass();
	glitchPass.renderToScreen = false;
	composer.addPass(glitchPass);

	shaderPass = new THREE.ShaderPass(THREE.RGBShiftShader);
	shaderPass.uniforms[ 'amount' ].value = 0.0015;
	shaderPass.renderToScreen = true;
	composer.addPass(shaderPass);

}

function moveCamera() {
	var timer = Date.now() * 0.0005;
	camera.position.x = Math.cos( timer ) * 300;
	camera.position.y = Math.sin( timer ) * 300;
	camera.position.z = Math.sin( timer ) * 200;
};

function render() {
	var time = Date.now();

	updateAudio();

	orb1.rotation.x += 0.05;
	orb1.rotation.y += 0.0002;

	orb2.rotation.x += 0.01  ;
	orb2.rotation.y += 0.02;

	//console.log(normLevel);

	// Particles responding to audio
	for( var i = scene2.children.length - 1; i >= 0; i--) { 
		var particle = scene2.children[i];
		particle.position.x = normLevel * 100;
		particle.position.y = normLevel * 100;
		if (normLevel >= 0.3) {
			materials[i].color.setHSL( Math.random(), 1.0, 0.5 );
		} else {
			materials[i].color.setHex( 0xffffff );
		}
	}
	

	controls.update();

	renderer.clear();
	composer.render(); // Glitch Render
	
	renderer.clearDepth();
	renderer.render( scene2, camera );
	//renderer.render( scene, camera );
	renderer.clearDepth();

	document.getElementById('clock').innerHTML = clock.getElapsedTime();

	var firstGlitch = 60;

	if( clock.getElapsedTime() > firstGlitch && clock.getElapsedTime() < firstGlitch + 1 ||
		clock.getElapsedTime() > firstGlitch + 4.5 && clock.getElapsedTime() < firstGlitch + 5.5 ||
		clock.getElapsedTime() > firstGlitch + 18 && clock.getElapsedTime() < firstGlitch + 18.7 ||
		clock.getElapsedTime() > firstGlitch + 34.5 && clock.getElapsedTime() < firstGlitch + 37.25) {
		glitchPass.generateGlitchTrigger();
	} else {
		glitchPass.generateTrigger();
	}
	
	//renderer.render(scene, camera); // Normal render
	if( clock.getElapsedTime() > 3 && clock.getElapsedTime() < 3.06 ) {
		setInterval(createLineCube(),50);
	}
	if( clock.getElapsedTime() > 49.2 ) {
		moveCamera();

	}
	if( clock.getElapsedTime() > 139.2 && clock.getElapsedTime() < 139.29 ) {
		createLineSpheres();
	}
}