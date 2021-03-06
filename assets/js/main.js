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
var camera, scene, scene2, sceneSphere, crossScene, renderer, composer, composer2, controls, materials = [], parameters = [], lineCubeArray = [];
var orb1, orb2;
var kaleidoPass;
var beatCutOff = 20;
var firstGlitch = 58.5;
var clearLines = false;
var kaleido = false;
var mirrorPass;
var lineSphere;
var glitchPass;

var clock = new THREE.Clock(false);
var autoMode = true;

var width = window.innerWidth;
var height = window.innerHeight;

init();
animate();
loadReification();

function init() {
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

	console.log("Persist");

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
	sceneBlackSphere = new THREE.Scene();

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
	render();
	requestAnimationFrame(animate);
}

function createJSON(json, name, colour, posx, posy, posz) {
	name.name = name;
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
		material.transparent = true;
		lineSphere = new THREE.LineSegments( geometry, material );
		lineSphere.scale.x = lineSphere.scale.y = lineSphere.scale.z = p[ 0 ];
		lineSphere.originalScale = p[ 2 ];
		lineSphere.rotation.y = Math.random() * Math.PI;
		lineSphere.updateMatrix();
		scene.add( lineSphere );
	}
};

function createLineSphereInner(tempColour, tempScene) {
	var i, vertex1, vertex2, material, p;
	var geometry = createGeometry();
	material = new THREE.LineBasicMaterial( { color: tempColour, opacity: 1, linewidth: 1 } );
	material.transparent = true;
	lineSphere = new THREE.LineSegments( geometry, material );
	lineSphere.scale.x = lineSphere.scale.y = lineSphere.scale.z = 0.5;
	lineSphere.originalScale = 1;
	lineSphere.rotation.y = Math.random() * Math.PI;
	lineSphere.updateMatrix();
	tempScene.add( lineSphere );
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

	renderSpherePass = new THREE.RenderPass(scene2, camera)
	composer2 = new THREE.EffectComposer(renderer);
	composer2.addPass(renderSpherePass);

	glitchPass = new THREE.GlitchPass();
	glitchPass.renderToScreen = false;
	composer.addPass(glitchPass);

	shaderPass = new THREE.ShaderPass(THREE.RGBShiftShader);
	shaderPass.uniforms[ 'amount' ].value = 0.0015;
	shaderPass.renderToScreen = true;
	composer.addPass(shaderPass);

	mirrorPass = new THREE.ShaderPass( THREE.MirrorShader );
	mirrorPass.renderToScreen = false;
	composer.addPass( mirrorPass );

	techPass = new THREE.ShaderPass( THREE.VerticalBlurShader );
	techPass.renderToScreen = false;
	composer.addPass(techPass);

	kaleidoPass = new THREE.ShaderPass(THREE.KaleidoShader);
	kaleidoPass.renderToScreen = true;
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
	composer2.render(); // Orbs, Lines - RGB Shift + Glitch
	renderer.clearDepth();
	renderer.render( sceneSphere, camera ); // Inner Sphere
	renderer.clearDepth();
	renderer.render( sceneBlackSphere, camera ); // Inner Sphere
	renderer.clearDepth();
	renderer.render( scene2, camera ); // Stars
	renderer.clearDepth();

	// document.getElementById('clock').innerHTML = clock.getElapsedTime();

	if(autoMode == true) {
		moveCamera();
	}

	// Timed Events
	// ------------
	if (clock.getElapsedTime() < 1 && clock.getElapsedTime() > 0) {
		for(i = 0; i < 3; i++) {
			createLineCube(i);
		}
	}

	if (clock.getElapsedTime() < 134 && clock.getElapsedTime() > 0) {
		orb1.rotation.x += 0.05;
		orb1.rotation.y += 0.0002;

		orb2.rotation.x += 0.01;
		orb2.rotation.y += 0.02;
	}
	if(clock.getElapsedTime() < 3 && clock.getElapsedTime() > 0) {
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
		orb1.rotation.x += 0.02;
		orb1.rotation.y += 0.0002;
		orb2.rotation.x += 0.004;
		orb2.rotation.y += 0.02;
	}
	if(clock.getElapsedTime() > 138 && clock.getElapsedTime() < 143.9 ) {
		controlCamera(Date.now() * 0.0011);
	}
	if(clock.getElapsedTime() > 142 && clock.getElapsedTime() < 143.9 ) {
		orb1.rotation.x += 0;
		orb1.rotation.y += 0.0002;
		orb2.rotation.x += 0;
		orb2.rotation.y += 0.02;
		console.log("I ");
	}
	if(clock.getElapsedTime() > 143.9 && clock.getElapsedTime() < 167.94 ) {
		techPass.renderToScreen = true;
		autoMode = false;
		console.log("love ");
	}
	if(clock.getElapsedTime() > 143.9 && clock.getElapsedTime() < 143.99) {
		createLineSpheres();
		createLineSphereInner(0x87daff, sceneSphere);

		if (clearLines == false) {
			scene.remove( scene.getObjectByName("line1") );
	    	scene.remove( scene.getObjectByName("line2") );
	    	scene.remove( scene.getObjectByName("line3") );
	    	clearLines = true;
		}

		console.log("her ");
	}

	// Add beat detection to line sphere
	if(clock.getElapsedTime() > 161) {
		for(var i = sceneSphere.children.length - 1; i >= 0; i--) {
			var particle = sceneSphere.children[i];
			particle.scale.x = lineSphere.scale.y = lineSphere.scale.z = 0.5 + normLevel / 5;
		}
	}

	if( clock.getElapsedTime() > 167.95 && clock.getElapsedTime() < 170) {
		autoMode = true;
	}

	if ( clock.getElapsedTime() > 192 && clock.getElapsedTime() < 303) {
		for(var i = scene2.children.length - 1; i >= 0; i--) {
			TweenLite.to(materials[i], 5, {opacity: 0});
		}
		for(var i = sceneSphere.children.length - 1; i >= 0; i--) {
			var particle = sceneSphere.children[i];
			TweenLite.to(particle.material, 5, {opacity: 0});
		}
		scene.remove(orb1);
		scene.remove(orb2);
	}

	if ( clock.getElapsedTime() > 200 && clock.getElapsedTime() < 200.4) {
		createLineSphereInner(0x000000, sceneBlackSphere);
	}

	var bgshift = 0x87daff;
	if (clock.getElapsedTime() > 202.5 && clock.getElapsedTime() < 202.525) { renderer.setClearColor( bgshift, 0.1); }
	if (clock.getElapsedTime() > 202.525 && clock.getElapsedTime() < 202.55) { renderer.setClearColor( bgshift, 0.15); }
	if (clock.getElapsedTime() > 202.55 && clock.getElapsedTime() < 202.575) { renderer.setClearColor( bgshift, 0.2); }
	if (clock.getElapsedTime() > 202.575 && clock.getElapsedTime() < 202.6) { renderer.setClearColor( bgshift, 0.25); }
	if (clock.getElapsedTime() > 202.6 && clock.getElapsedTime() < 202.625) { renderer.setClearColor( bgshift, 0.3); }
	if (clock.getElapsedTime() > 202.65 && clock.getElapsedTime() < 202.675) { renderer.setClearColor( bgshift, 0.35); }
	if (clock.getElapsedTime() > 202.675 && clock.getElapsedTime() < 202.7) { renderer.setClearColor( bgshift, 0.4); }
	if (clock.getElapsedTime() > 202.7 && clock.getElapsedTime() < 202.725) { renderer.setClearColor( bgshift, 0.45); }
	if (clock.getElapsedTime() > 202.75 && clock.getElapsedTime() < 202.775) { renderer.setClearColor( bgshift, 0.5); }
	if (clock.getElapsedTime() > 202.775 && clock.getElapsedTime() < 202.8) { renderer.setClearColor( bgshift, 0.55); }
	if (clock.getElapsedTime() > 202.8 && clock.getElapsedTime() < 202.825) { renderer.setClearColor( bgshift, 0.6); }
	if (clock.getElapsedTime() > 202.825 && clock.getElapsedTime() < 202.85) { renderer.setClearColor( bgshift, 0.65); }
	if (clock.getElapsedTime() > 202.875 && clock.getElapsedTime() < 202.9) { renderer.setClearColor( bgshift, 0.7); }
	if (clock.getElapsedTime() > 202.925 && clock.getElapsedTime() < 202.95) { renderer.setClearColor( bgshift, 0.75); }
	if (clock.getElapsedTime() > 202.975 && clock.getElapsedTime() < 203) { renderer.setClearColor( bgshift, 0.8); }
	if (clock.getElapsedTime() > 203 && clock.getElapsedTime() < 203.025) { renderer.setClearColor( bgshift, 0.85); }
	if (clock.getElapsedTime() > 203.025 && clock.getElapsedTime() < 203.05) { renderer.setClearColor( bgshift, 0.9); }
	if (clock.getElapsedTime() > 203.075 && clock.getElapsedTime() < 203.1) { renderer.setClearColor( bgshift, 0.95); }
	if (clock.getElapsedTime() > 203.125 && clock.getElapsedTime() < 203.15) { renderer.setClearColor( bgshift, 1); }

	if(clock.getElapsedTime() > 203 && clock.getElapsedTime() < 303) {
		for(var i = sceneBlackSphere.children.length - 1; i >= 0; i--) {
			var particle = sceneBlackSphere.children[i];
			particle.scale.x = lineSphere.scale.y = lineSphere.scale.z = 0.5 + normLevel / 5;
		}
		for(var i = scene2.children.length - 1; i >= 0; i--) {
			TweenLite.to(materials[i], 40, {opacity: 1});
		}
	}

	if (clock.getElapsedTime() > 282.5 && clock.getElapsedTime() < 282.7) {
		if(kaleido == false) {
			composer.addPass(kaleidoPass);
			kaleido = true;
		}
	}

	if(clock.getElapsedTime() > 307) {
		for(var i = scene2.children.length - 1; i >= 0; i--) {
			TweenLite.to(materials[i], 5, {opacity: 1});
		}
		for(var i = sceneSphere.children.length - 1; i >= 0; i--) {
			var particle = sceneSphere.children[i];
			TweenLite.to(particle.material, 5, {opacity: 1});
		}
		for(var i = sceneBlackSphere.children.length - 1; i >= 0; i--) {
			var particle = sceneBlackSphere.children[i];
			TweenLite.to(particle.material, 5, {opacity: 0});
		}
	}

	if (clock.getElapsedTime() > 307.5 && clock.getElapsedTime() < 307.525) { renderer.setClearColor( bgshift, 1); }
	if (clock.getElapsedTime() > 307.525 && clock.getElapsedTime() < 307.55) { renderer.setClearColor( bgshift, 0.95); }
	if (clock.getElapsedTime() > 307.55 && clock.getElapsedTime() < 307.575) { renderer.setClearColor( bgshift, 0.9); }
	if (clock.getElapsedTime() > 307.575 && clock.getElapsedTime() < 307.6) { renderer.setClearColor( bgshift, 0.85); }
	if (clock.getElapsedTime() > 307.6 && clock.getElapsedTime() < 307.625) { renderer.setClearColor( bgshift, 0.8); }
	if (clock.getElapsedTime() > 307.65 && clock.getElapsedTime() < 307.675) { renderer.setClearColor( bgshift, 0.75); }
	if (clock.getElapsedTime() > 307.675 && clock.getElapsedTime() < 307.7) { renderer.setClearColor( bgshift, 0.7); }
	if (clock.getElapsedTime() > 307.7 && clock.getElapsedTime() < 307.725) { renderer.setClearColor( bgshift, 0.65); }
	if (clock.getElapsedTime() > 307.75 && clock.getElapsedTime() < 307.775) { renderer.setClearColor( bgshift, 0.6); }
	if (clock.getElapsedTime() > 307.775 && clock.getElapsedTime() < 307.8) { renderer.setClearColor( bgshift, 0.55); }
	if (clock.getElapsedTime() > 307.8 && clock.getElapsedTime() < 307.825) { renderer.setClearColor( bgshift, 0.5); }
	if (clock.getElapsedTime() > 307.825 && clock.getElapsedTime() < 307.85) { renderer.setClearColor( bgshift, 0.45); }
	if (clock.getElapsedTime() > 307.875 && clock.getElapsedTime() < 307.9) { renderer.setClearColor( bgshift, 0.4); }
	if (clock.getElapsedTime() > 307.925 && clock.getElapsedTime() < 307.95) { renderer.setClearColor( bgshift, 0.35); }
	if (clock.getElapsedTime() > 307.975 && clock.getElapsedTime() < 308) { renderer.setClearColor( bgshift, 0.3); }
	if (clock.getElapsedTime() > 308 && clock.getElapsedTime() < 308.025) { renderer.setClearColor( bgshift, 0.25); }
	if (clock.getElapsedTime() > 308.025 && clock.getElapsedTime() < 308.05) { renderer.setClearColor( bgshift, 0.2); }
	if (clock.getElapsedTime() > 308.075 && clock.getElapsedTime() < 308.1) { renderer.setClearColor( bgshift, 0.15); }
	if (clock.getElapsedTime() > 308.125 && clock.getElapsedTime() < 308.15) { renderer.setClearColor( bgshift, 0); }
}

// Off grid intro page amends
var definitions = {
	constructive: '<p>Constructivism as a paradigm or worldview posits that learning is an active, constructive process based on <span class="morehoverlink" id="observation">observation.</span>  The learner is an information constructor. People actively construct or create their own subjective representations of objective reality.</p>',
	perception: '<p>The process by which the nature and meaning of sensory stimuli are recognized and <span class="morehoverlink" id="interpretation">interpreted.</span></p>',
	experience: '<p>The wisdom derived from the changes and trials of life, this is typically produced by an event - whether witnessed or <span class="morehoverlink" id="participation">participated</span> in. A person with considerable experience in a specific field can gain reputation or perception to be an expert.</p>',
	sensory: '<p>Processes and structures within an organism that receive stimuli from the environment and convey these <span class="morehoverlink" id="impression">impressions</span> to the brain.</p>'
}

var furtherdefinitions = {
	observation: '<p>Observation is an activity of a living being, such as a human, which involves paying close attention to a subject or situation in order to receive knowledge of the subject, environment or world through the senses. Observation can also refer to a method of research or data collection.</p>',
	experience: '<p>Human experience is the ultimate source and justification for all knowledge. Experience itself has accumulated in human memory and culture, gradually producing the methods of intelligence called "reason" and "science."</p>',
	interpretation: '<p>An act of interpreting or explaining what is obscure - a translation, version or construction. This is usually judged in relation to the current body of knowledge.</p>',
	participation: '<p>The act or state of sharing in common with others. Meaningful participation requires that individuals are entitled to collaborate in decisions that directly affect them.</p>',
	impression: '<p>An idea, feeling, or opinion based on a subject in which some confidence is placed, these are often formed without conscious thought or on the basis of little evidence. This effect is produced in the mind by a stimulus and/or sensation.</p>'
}

var hov = 0;
var morehov = 0;

$(document).on("mouseenter", ".hoverlink", function() {
	hov = 1;
	clearTimeout();
	$("#moreinfo").html(definitions[this.id]);
}),
$(document).on("mouseleave", ".hoverlink", function() {
	hov = 0;
	setTimeout(function() {
		if(hov == 0){
			$("#moreinfo").html("");
		}
	}, 2000);
}),
$(document).on("mouseenter", "#moreinfo", function() {
	hov = 1;
	clearTimeout();
}),
$(document).on("mouseleave", "#moreinfo", function() {
	hov = 0;
	setTimeout(function() {
		if(hov == 0){
			$("#moreinfo").html("");
		}
	}, 2000);
}),
$(document).on("mouseenter", ".morehoverlink", function() {
	$(".tp-logo-wrap").hide();
	morehov = 1;
	clearTimeout();
	$("#furtherinfo").html(furtherdefinitions[this.id]);
}),
$(document).on("mouseleave", ".morehoverlink", function() {
	morehov = 0;
	setTimeout(function() {
		if(morehov == 0){
			$(".tp-logo-wrap").show();
			$("#furtherinfo").html("");
		}
	}, 1500);
});
