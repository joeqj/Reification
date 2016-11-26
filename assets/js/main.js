/*
*
*	Joe QJ - Reification
*	For any questions please email heyimjoeqj@gmail.com
*
*/

var BEAT_HOLD_TIME = 60; //num of frames to hold a beat
var BEAT_DECAY_RATE = 0.97;
var BEAT_MIN = 0.6; //level less than this is no beat
var cameraTimer;
var camera, scene, scene2, renderer, composer, composer2, controls, materials = [], parameters = [], lineCubeArray = [];
var orb1, orb2;
var beatCutOff = 20;
var clearLines = false;
var mirrorPass;
var lineSphere;
var glitchPass;

var stats;

var clock = new THREE.Clock(false);
var autoMode = true;

var width = window.innerWidth;
var height = window.innerHeight;

init();
animate();
loadReification();

function init() {
	stats = new Stats();
	stats.showPanel( 2 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );



	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		audioContext = new window.AudioContext();
	} catch(e) {
		alert("Why are you using an outdated browser bro? Use Chrome or Firefox for audio to work.");
	}

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

	orb1 = new THREE.Object3D();
	createJSON('assets/json/reificationorb.json', orb1, 0xffffff, 150, 100, 100);
	createJSON('assets/json/reificationorbcentre.json', orb1, 0x000000, 150, 100, 100);

	orb2 = new THREE.Object3D();
	createJSON('assets/json/reificationorb.json', orb2, 0xffffff, -150, 100, 100);
	createJSON('assets/json/reificationorbcentre.json', orb2, 0x000000, -150, 100, 100);
	
	
	// Sprites
	var geometry = new THREE.Geometry();
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
	drawParticles(geometry, parameters);

	postProcessing();

	window.addEventListener( 'resize', onWindowResize, false );
	window.addEventListener( 'dblclick', startAuto, false );
}

function drawParticles(geometry, parameters) {
	for ( i = 0; i < parameters.length; i ++ ) {
		size  = parameters[i][1];
		materials[i] = new THREE.PointsMaterial( { size: size } );
		var particles = new THREE.Points( geometry, materials[i] );
		materials[i].transparent = true;
		particles.rotation.x = Math.random() * 6;
		particles.rotation.y = Math.random() * 6;
		particles.rotation.z = Math.random() * 6;
		scene2.add( particles );
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	composer.setSize( window.innerWidth, window.innerHeight );
}

function startAuto() {
	if (autoMode == true) {
		autoMode = false;
	} else {
		autoMode = true;
	};
}

function animate() {
	stats.begin();
	render();
	stats.end();
	requestAnimationFrame(animate);
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

function createLineCube(index) {
	colourFuck = 2.5;
	increment = 0.5
	var geometry = new THREE.Geometry(),
		points = hilbert3D( 
			new THREE.Vector3( 0,0,0 ), 200.0, 2, 0, 1, 
			Math.floor(Math.random() * 7) + 1, 2, 4, 
			Math.floor(Math.random() * 7) + 1, 6, 7 ),
		colors = [];
	for (i = 0; i < points.length; i ++) {
		geometry.vertices.push(points[ i ]);
		colors[i] = new THREE.Color( 0xffffff );
		colors[i].setHSL( colourFuck -= increment, 0.1, Math.max( 0, ( 200 + points[ i ].x ) / 200 ) * 0.5 );
	}
	geometry.colors = colors;

	// lines
	material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors });
	var line, p, scale = 2.5, d = 0;
	var parameters =  [ [ material, scale * 1.5, [0,2,0],  geometry ] ];
	for (i = 0; i < parameters.length; ++i) {
		p = parameters[ i ];
		line = new THREE.Line( p[ 3 ],  p [0] );
		line.scale.x = line.scale.y = line.scale.z =  p[ 1 ];
		line.position.x = p[ 2 ][ 2 ];
		line.position.y = p[ 2 ][ 1 ];
		line.position.z = p[ 2 ][ 2 ];
		lineCubeArray.push(line);
	}
};

function createLineSpheres() {
	var i, vertex1, vertex2, material, p,
		parameters = [ 
			[ 1.2, 0x8e87ff, 0.5, 1 ], 
			[ 1.25, 0x000833, 0.8, 1 ], 
			[ 3.0, 0xaaaaaa, 0.75, 2 ], 
			[ 3.5, 0xffffff, 0.5, 1 ], 
			[ 4.5, 0xffffff, 0.25, 1 ], 
			[ 5.5, 0xffffff, 0.125, 1 ] 
		];
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

function createLineSphereInner() {
	var i, vertex1, vertex2, material, p;
	var geometry = createGeometry();
	material = new THREE.LineBasicMaterial( { color: 0x87daff, opacity: 1, linewidth: 1 } );
	lineSphere = new THREE.LineSegments( geometry, material );
	lineSphere.scale.x = lineSphere.scale.y = lineSphere.scale.z = 0.5;
	lineSphere.originalScale = 1;
	lineSphere.rotation.y = Math.random() * Math.PI;
	lineSphere.updateMatrix();
	sceneSphere.add( lineSphere );
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
	var sum = 0;
	var beatTime = 0;
	for(var j = 0; j < length; ++j) {
		sum += freqByteData[j];
	}
	var aveLevel = sum / length;
	normLevel = (aveLevel / 256) * 2.5; //256 is the highest a freq data can be

	// Beat Detection
	if (normLevel  > beatCutOff && normLevel > BEAT_MIN){
		beatCutOff = normLevel *1.1;
	}else{
		if (beatTime < BEAT_HOLD_TIME){
			beatTime ++;
		}else{
			beatCutOff *= BEAT_DECAY_RATE;
		}
	}
}

function loadReification(){
	loadAudio();
}

function postProcessing() {
	renderPass = new THREE.RenderPass(scene, camera)
	composer = new THREE.EffectComposer(renderer);
	composer.addPass(renderPass);
	
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

	composer2 = new THREE.EffectComposer(renderer);
	composer2.addPass(renderPass);

	mirrorPass = new THREE.ShaderPass( THREE.MirrorShader );
	mirrorPass.renderToScreen = false;
	composer2.addPass( mirrorPass );

	// var clearMask = new THREE.ClearMaskPass();
	// composer.addPass(clearMask);

	// techPass = new THREE.ShaderPass( THREE.VerticalBlurShader );
	// techPass.renderToScreen = false;
	// composer.addPass(techPass);
}

function moveCamera() {
	if(clock.getElapsedTime() < 138 || clock.getElapsedTime() > 167.95) {
		cameraTimer = Date.now() * 0.0005;
	}
	camera.position.x = Math.cos(cameraTimer) * 300;
	camera.position.y = Math.sin(cameraTimer) * 300;
	camera.position.z = Math.sin(cameraTimer) * 200;
}

function controlCamera(speed) {
	cameraTimer =  speed;
	if(autoMode == true) {
		moveCamera();
	}
}

function render() {
	updateAudio();

	// Flys orb off screen
	// orb1.applyMatrix( new THREE.Matrix4().makeTranslation( -0.5, 0.5, -0.5 ) );

	// Particles responding to audio
	for(var i = scene2.children.length - 1; i >= 0; i--) { 
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
	composer.render(); // Orbs, Lines - RGB Shift + Glitch
	renderer.clearDepth();
	if(clock.getElapsedTime() < 168) {
		composer2.render(); // Orbs, Lines - RGB Shift + Glitch
	}
	renderer.render( sceneSphere, camera ); // Inner Sphere
	renderer.clearDepth();
	renderer.render( scene2, camera ); // Stars
	renderer.clearDepth();

	document.getElementById('clock').innerHTML = clock.getElapsedTime();

	if(autoMode == true) {
		moveCamera();
	}

	// Timed Events
	// ------------
	if (clock.getElapsedTime() < 1) {
		for(i = 0; i < 3; i++) {
			createLineCube(i);
		}
	}
	
	if (clock.getElapsedTime() < 134) {
		orb1.rotation.x += 0.05;
		orb1.rotation.y += 0.0002;

		orb2.rotation.x += 0.01;
		orb2.rotation.y += 0.02;

	}
	if(clock.getElapsedTime() < 3) {
		// Setting particles to initialise as transparent
		for(var i = scene2.children.length - 1; i >= 0; i--) {
			materials[i].opacity = 0;
		}
	}

	if(clock.getElapsedTime() > 3 && clock.getElapsedTime() < 4) {
		// Begin Fade in of particles
		for(var i = scene2.children.length - 1; i >= 0; i--) {
			TweenLite.to(materials[i], 120, {opacity: 1.5 + 0.5*Math.sin(new Date().getTime() * .0025)});
		}
	}
	
	if(clock.getElapsedTime() > 48 && clock.getElapsedTime() < 48.02) {
		var line1 = lineCubeArray[0]
		line1.name = "line1";
		scene.add( line1 );
	}

	if(clock.getElapsedTime() > 60 && clock.getElapsedTime() < 60.02) {
		var line2 = lineCubeArray[2]
		line2.name = "line2";
		scene.add( line2 );
	}

	if(clock.getElapsedTime() > 54 && clock.getElapsedTime() < 54.02) {
		var line3 = lineCubeArray[1]
		line3.name = "line3";
		scene.add( line3 );
	}

	var firstGlitch = 58.5;

	if(clock.getElapsedTime() > firstGlitch && clock.getElapsedTime() < firstGlitch + 1 ||
		clock.getElapsedTime() > firstGlitch + 4.5 && clock.getElapsedTime() < firstGlitch + 5.5 ||
		clock.getElapsedTime() > firstGlitch + 18 && clock.getElapsedTime() < firstGlitch + 18.7 ||
		clock.getElapsedTime() > firstGlitch + 34.8 && clock.getElapsedTime() < firstGlitch + 37.25) {
		glitchPass.generateGlitchTrigger();
	} else {
		glitchPass.generateTrigger();
	}

	if(clock.getElapsedTime() > 132 && clock.getElapsedTime() < 134 ) {
		mirrorPass.renderToScreen = true;
		// techPass.renderToScreen = true;
	}
	if(clock.getElapsedTime() > 134 && clock.getElapsedTime() < 136 ) {
		orb1.rotation.x += 0.04;
		orb1.rotation.y += 0.0002;
		orb2.rotation.x += 0.008;
		orb2.rotation.y += 0.02;
	}
	if(clock.getElapsedTime() > 136 && clock.getElapsedTime() < 138 ) { 
		orb1.rotation.x += 0.03;
		orb1.rotation.y += 0.0002;
		orb2.rotation.x += 0.006;
		orb2.rotation.y += 0.02;
	}
	if(clock.getElapsedTime() > 138 && clock.getElapsedTime() < 142 ) {
		controlCamera(Date.now() * 0.0010); 
		orb1.rotation.x += 0.02;
		orb1.rotation.y += 0.0002;
		orb2.rotation.x += 0.004;
		orb2.rotation.y += 0.02;
	}
	if(clock.getElapsedTime() > 142 && clock.getElapsedTime() < 143.9 ) {
		controlCamera(Date.now() * 0.0020); 
		orb1.rotation.x += 0;
		orb1.rotation.y += 0.0002;
		orb2.rotation.x += 0;
		orb2.rotation.y += 0.02;
	}
	if(clock.getElapsedTime() > 143.9 && clock.getElapsedTime() < 167.94 ) {
		mirrorPass.renderToScreen = false;
		autoMode = false;
	}
	if(clock.getElapsedTime() > 143.9 && clock.getElapsedTime() < 143.99) {
		createLineSpheres();
		createLineSphereInner();
		
		if (clearLines == false) {
			scene.remove( scene.getObjectByName("line1") );
	    	scene.remove( scene.getObjectByName("line2") );
	    	scene.remove( scene.getObjectByName("line3") );
	    	clearLines = true;
		}
	}

	// Add beat detection to line sphere
	if(clock.getElapsedTime() > 161) {
		for(var i = sceneSphere.children.length - 1; i >= 0; i--) { 
			var particle = sceneSphere.children[i];
			particle.scale.x = lineSphere.scale.y = lineSphere.scale.z = 0.5 + normLevel / 5;
		}
	}	

	if( clock.getElapsedTime() > 167.95) {
		autoMode = true;
	}
}