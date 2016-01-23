// Backup Exploration.js (c) 2015 sandeen
// Vertex shader program----------------------------------
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 normal = normalize(a_Normal.xyz);\n' +
  '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
  '  vec3 diffuse = (u_LightColor * a_Color.rgb * nDotL)*0.9 + 0.1;\n' +
  '  v_Color = vec4(diffuse,a_Color.a);\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global variables all declared up here, and some initialized
var ANGLE_STEP = 45.0;
var floatsPerVertex = 10;

var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var modelMatrix = new Matrix4(); // Model matrix
var viewMatrix = new Matrix4();  // View matrix
var projMatrix = new Matrix4();  // Projection matrix
var projViewMatrix = new Matrix4();
var mvpMatrix = new Matrix4();   // Model view projection matrix
var isFirstTime = true; // used to initialize matrices
var eyeX,eyeY,eyeZ;
var atX,atY,atZ;
var upX,upY,upZ;
var viewRange = 1;
// theta is angle above or below the horizontal plane
var theta = 0.0; var changeTheta = 0.0; 
// phi is the angle left or right from the camera's line of sight
var phi = 0.0; var changePhi = 0.0;
// affects rapidity with which the keys make the camera move
var stepLength = 0.1;
// affects speed at which the camera rotates
var mouseSpeed = 8;
// Current rotation angle
var currentAngle = 10.0;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  winResize();

  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas) }; 
  
            // when user's mouse button goes down call mouseDown() function
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
  
                      // call mouseMove() function          
  canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)};
            // NOTE! 'onclick' event is SAME as on 'mouseup' event
            // in Chrome Brower on MS Windows 7, and possibly other 
            // operating systems; use 'mouseup' instead.

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  gl.depthFunc(gl.LESS);
  gl.enable(gl.DEPTH_TEST); 

  // Get storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) { 
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }
  
  // Get the storage locations of uniform variables and so on
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  if (!u_LightColor || !u_LightDirection) { 
    console.log('Failed to get the storage location');
    return;
  }
  
  // Set up the uniform light color variable to white light
  // set the light direction to be almost vertical, then normalize it 
  // and pass it to the uniform variable in the vshader
  gl.uniform3f(u_LightColor, 1.0,1.0,1.0);
  var lightDirection = new Vector3([0.0,0.1,-1.0]);
  lightDirection.normalize();
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // shift distance
  var shift = 0.1;

  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle,0);  // Update the rotation angle
    shift = animate(0,shift);
    draw(gl, n, currentAngle, shift, u_MvpMatrix);   // Draw the stuff

    // draw(gl,n,currentAngle,shift,mvpMatrix,u_MvpMatrix);
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function draw(gl, n, currentAngle, shift, u_MvpMatrix) {
//==============================================================================
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//----------------------Create, fill UPPER viewport------------------------
  gl.viewport(0,                              // Viewport lower-left corner
              0,       // location(in pixels)
              gl.canvas.width/2,          // viewport width,
              gl.canvas.height);      // viewport height in pixels.

  var vpAspect = (gl.canvas.width/2) /      // On-screen aspect ratio for
                (gl.canvas.height);   // this camera: width/height.
  

  if (isFirstTime==true){ // sets initial coords for viewmatrix
    eyeX = 0;       eyeY = 1;       eyeZ = -5;
    atX  = eyeX+0;  atY  = eyeY+0;  atZ  = eyeZ+2;
    upX  = 0;       upY  = 1;       upZ  =  0;
    isFirstTime = false; // prevents this from resetting the viewmatrix
  }

  viewMatrix.setLookAt(eyeX,eyeY,eyeZ, // sets up view matrix each time
                       atX, atY, atZ, // draw is called, updating it with
                       upX, upY, upZ); // current coordinates

  // creates projection matrix
  projMatrix.setPerspective(40, vpAspect, stepLength, 100); 
  // combines the projection and view matrices into one so we can just
  // fling all the model matrices at it without multiplying proj and view
  // matrices together each time
  projViewMatrix.set(projMatrix).multiply(viewMatrix);

  drawMyScene(gl,u_MvpMatrix, projViewMatrix);
//----------------------------------------------------------
  projMatrix.setOrtho(-1,1,-1,1,0.1,100);
  projViewMatrix.set(projMatrix).multiply(viewMatrix);
  gl.viewport(gl.canvas.width/2,
              0,
              gl.canvas.width/2,
              gl.canvas.height);
  drawMyScene(gl,u_MvpMatrix,projViewMatrix);

  // Last time that this function was called:  (used for animation timing)
  g_last = Date.now();
}

function drawMyScene(myGL, myu_MvpMatrix, myViewMatrix) {
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

  // DON'T clear <canvas> or you'll WIPE OUT what you drew 
  // in all previous viewports!
  // myGL.clear(gl.COLOR_BUFFER_BIT);

  makeHand(.2, .3, .4, myGL, myu_MvpMatrix);
  
  makeTank(-1, 0, 0, myGL, myu_MvpMatrix);

  modelMatrix.setTranslate(0,0,0);
  modelMatrix.rotate(90, 1, 0, 0); // determines orientation of grid
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  myGL.uniformMatrix4fv(myu_MvpMatrix, false, mvpMatrix.elements);
  myGL.drawArrays(myGL.LINES, gndStart/floatsPerVertex, gndVerts.length/floatsPerVertex);

  makeSphere();
  modelMatrix.setTranslate(2,0,0);
  modelMatrix.rotate(90, 1, 0, 0); // determines orientation of grid
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  myGL.uniformMatrix4fv(myu_MvpMatrix, false, mvpMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphStart/floatsPerVertex,sphVerts.length/floatsPerVertex);

  // The below code makes the object consisting of several spheres.
  // We just shift each successive sphere's center to a FIXED point
  // along the previous sphere's shell.  This idea is actually a 
  // possible method to construct Fourier series, but the frame rate 
  // is far too low to make it visible, so I had to adjust the rotation
  // rates so that they don't actually approximate a Fourier Series  
  makeSphere();
  modelMatrix.setTranslate(1,0,5);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.rotate(Date.now()/2048*34-37,0,0);  
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  myGL.uniformMatrix4fv(myu_MvpMatrix, false, mvpMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphStart/floatsPerVertex,sphVerts.length/floatsPerVertex);

  pushMatrix(modelMatrix);
  
  makeSphere();
  modelMatrix.translate(0,.75,0);
  modelMatrix.scale(.75,.75,.75);
  modelMatrix.rotate(Date.now()/512*34-37,0,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  myGL.uniformMatrix4fv(myu_MvpMatrix, false, mvpMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphStart/floatsPerVertex,sphVerts.length/floatsPerVertex);

  pushMatrix(modelMatrix);

  makeSphere();
  modelMatrix.translate(0,.75,0);
  modelMatrix.scale(.75,.75,.75);
  modelMatrix.rotate(Date.now()/256*34-37,0,0); // determines orientation of grid
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  myGL.uniformMatrix4fv(myu_MvpMatrix, false, mvpMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphStart/floatsPerVertex,sphVerts.length/floatsPerVertex);

  makeSphere();
  modelMatrix.translate(0,.75,0);
  modelMatrix.scale(.75,.75,.75);
  modelMatrix.rotate(Date.now()/128*34-37,0,0); // determines orientation of grid
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  myGL.uniformMatrix4fv(myu_MvpMatrix, false, mvpMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,sphStart/floatsPerVertex,sphVerts.length/floatsPerVertex);

  makeAxes();
  modelMatrix.setTranslate(0,0,2);
  modelMatrix.rotate(90, 1, 0, 0); // determines orientation of grid
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.scale(4,4,4);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  myGL.uniformMatrix4fv(myu_MvpMatrix, false, mvpMatrix.elements);
  myGL.drawArrays(myGL.LINES,axesStart/floatsPerVertex,axesVerts.length/floatsPerVertex);
}

function makeTank(x, y, z, gl, u_MvpMatrix) {
  modelMatrix.setTranslate(x, y, z);

  modelMatrix.rotate(-11,1,0,0);
  // modelMatrix.rotate(Date.now()/512*34-37,0,0);
  modelMatrix.translate(Math.cos((Date.now()/628)),0,0); 
  modelMatrix.translate(0,0,-Math.sin((Date.now()/628))); 
  modelMatrix.rotate(-90,0,1,0);
  modelMatrix.rotate(Date.now()/11,0,1,0);

  pushMatrix(modelMatrix);
  modelMatrix.scale(1,1,.67);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, rectStart/floatsPerVertex, rectVerts.length/floatsPerVertex);

  // Draw 4 wheels and put them on the tank
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(.31,-.07,-.37);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.rotate(Date.now()/6,0,1,0);
  modelMatrix.scale(.36,.05,.36);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(-.31,-.07,-.37);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.rotate(Date.now()/6,0,1,0);
  modelMatrix.scale(.36,.05,.36);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(.31,-.07,.37);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.rotate(Date.now()/6,0,1,0);
  modelMatrix.scale(.36,.05,.36);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(-.31,-.07,.37);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.rotate(Date.now()/6,0,1,0);
  modelMatrix.scale(.36,.05,.36);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  // Draw gun mount---------------------

  modelMatrix = popMatrix();
  modelMatrix.rotate(Math.cos((Date.now()/628))*271,0,1,0);
  pushMatrix(modelMatrix);
  modelMatrix.translate(.0,.2,-.0005);
  modelMatrix.scale(.6,.13,.6);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(.0,.37,-.0005);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.scale(.46,.1,.46);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(.0,.47,-.0005);
  modelMatrix.rotate(360,0,1,0);
  modelMatrix.scale(.36,.13,.36);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  // Draw gun------------------------------------------

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(-.2,.97,-.0005);
  modelMatrix.rotate(76,0,0,1);
  modelMatrix.translate(-0.4,.2,0);
  modelMatrix.scale(.06,.4,.06);

  pushMatrix(modelMatrix);

  makeAxes();
  modelMatrix.rotate(90, 1, 0, 0); // determines orientation of grid
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.scale(1,4,4);
  modelMatrix.translate(1,0,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.LINES,axesStart/floatsPerVertex,axesVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);
}

  function makeHand(x, y, z, gl, u_MvpMatrix) {
//===============================DRAW HAND===============================
  modelMatrix.setTranslate(-x-4,-y-1,-z);//-0.4,-0.6, 0.0);
  modelMatrix.rotate(-45, 0, 1, 0);
  modelMatrix.scale(4,4,4);
  pushMatrix(modelMatrix);
  modelMatrix.rotate(90, 1,0,0);
  modelMatrix.scale(.75,.1275,.75);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  // Draw hand under modelMatrix's transformed coordinate system
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);
  modelMatrix = popMatrix()
  pushMatrix(modelMatrix);

  //=============MIDDLE FINGER==============

  modelMatrix.scale(.16,.16,.16); // shrinks hex primitive to appropriate scale
  modelMatrix.translate(0,1.3,0); // moves hex to proper location
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0); 
  modelMatrix.translate(-0.4,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.9,.9,.9);
  modelMatrix.translate(0,.7,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.9,.9,.9);
  modelMatrix.translate(0,.5,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.2,0);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  //=============RING FINGER==============
  
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);

  modelMatrix.scale(.16,.16,.16);
  modelMatrix.translate(0.9,1.2,0);
  modelMatrix.rotate(-8,0,0,1);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.1,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.8,.8,.8);
  modelMatrix.translate(0,.8,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.8,.9,.8);
  modelMatrix.translate(0,.9,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,.9,0);

  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  //=============INDEX FINGER==============

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);

  modelMatrix.scale(.15,.15,.15);
  modelMatrix.translate(-1.5,1.2,0);
  modelMatrix.rotate(12,0,0,1);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.1,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.8,.8,.8);
  modelMatrix.translate(0,.8,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.8,.8,.8);
  modelMatrix.translate(0,.8,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);  // modelMatrix.translate(dist/120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);lMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  //=============PINKY FINGER==============

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);

  modelMatrix.scale(.15,.15,.15);
  modelMatrix.translate(2,.8,0);
  modelMatrix.rotate(-12,0,0,1);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0); //(currentAngle,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.8,.8,.8);
  modelMatrix.translate(0,.8,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.8,.8,.8);
  modelMatrix.translate(0,.8,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  //=============THUMB (FINGER)==============

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);

  modelMatrix.scale(.15,.15,.15);
  modelMatrix.translate(-1.5,.7,0);
  modelMatrix.rotate(72,0,0,1);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);

  modelMatrix.scale(.8,.8,.8);
  modelMatrix.translate(0,.8,0);
  modelMatrix.rotate(Math.cos((Date.now()/628))*34-37,1,0,0);
  modelMatrix.translate(0,1.3,0);
  mvpMatrix.set(projViewMatrix).multiply(modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, hexStart/floatsPerVertex, hexVerts.length/floatsPerVertex);
}

function myKeyDown(ev) {
//===============================================================================//
// Strafing only requires us to adjust the horizontal, not vertical,
// eye positions AND lookat positions (otherwise we'd rotate to keep 
// looking at a fixed point as we passed it).  Moving forward and 
// backward, we want to be move out of the horizontal plane, so we
// adjust all 6 eye and lookat coordinates

  if (ev.keyCode ==65) { //left
    eyeX = eyeX + stepLength * Math.cos(phi);
    // eyeY += stepLength * Math.sin(theta);
    eyeZ = eyeZ + stepLength * Math.sin(phi);
    atX = atX + stepLength * Math.cos(phi);
    // atY += stepLength * Math.sin(theta);
    atZ = atZ + stepLength * Math.sin(phi);
  }
  if (ev.keyCode ==87) { //forward
    eyeX = eyeX - stepLength * Math.cos(theta) * Math.sin(phi);
    eyeY = eyeY + stepLength * Math.sin(theta);
    eyeZ = eyeZ + stepLength * Math.cos(theta) * Math.cos(phi);
    atX = atX - stepLength * Math.cos(theta) * Math.sin(phi);
    atY = atY + stepLength * Math.sin(theta);
    atZ = atZ + stepLength * Math.cos(theta) * Math.cos(phi);
  }
  if (ev.keyCode ==83) { //back
    eyeX = eyeX + stepLength * Math.cos(theta) * Math.sin(phi);
    eyeY = eyeY - stepLength * Math.sin(theta);
    eyeZ = eyeZ - stepLength * Math.cos(theta) * Math.cos(phi);
    atX = atX + stepLength * Math.cos(theta) * Math.sin(phi);
    atY = atY - stepLength * Math.sin(theta);
    atZ = atZ - stepLength * Math.cos(theta) * Math.cos(phi);
  }
  if (ev.keyCode ==68) { //right
    eyeX = eyeX - stepLength * Math.cos(phi);
    // eyeY -= stepLength * Math.sin(theta);
    eyeZ = eyeZ - stepLength * Math.sin(phi);
    atX = atX - stepLength * Math.cos(phi);
    // atY -= stepLength * Math.sin(theta);
    atZ = atZ - stepLength * Math.sin(phi);
  }
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well
// Nothing to do when user releases a key except stop doing what the key
// was doing, which automatically happens when the key is released
}

function myKeyPress(ev) {
//===============================================================================
// Not actually used
}

function myMouseMove(ev, gl, canvas) {
//==============================================================================
  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);

  phi = xMdragTot / mouseSpeed; // horizontal camera rotation
  theta = yMdragTot / mouseSpeed; // vertical camera rotation

  phi = phi % 360; // 360 degrees in a circle
  theta = theta % 360; // 360 degrees in a circle

  // Rotating the camera requires us to make sure it's position in the right
  // spot, then extend out to its lookat position and rotate each component 
  // as necessitated by the mouse movements
  atX = eyeX; // set it equal to the current eyeX
  atX -= viewRange * Math.cos(theta) * Math.sin(phi); // then subtract
  atY = eyeY; // set it equal to the current eyeY
  atY += viewRange * Math.sin(theta); // then subtract
  atZ = eyeZ; // set it equal to the current eyeZ
  atZ += viewRange * Math.cos(theta) * Math.cos(phi); // then subtract
}

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = gl.canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2); 
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
}

function myMouseUp(ev, gl, canvas) {
//==============================================================================
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
}

function animate(angle,shift) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >   0.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle <  -65.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  shift = -shift;

  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

// Increments rate of rotation
function moreCCW() {
  ANGLE_STEP += 10; 
}

// Decrements rate of rotation
function lessCCW() {
  ANGLE_STEP -= 10; 
}

function winResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="winResize()">

  var nuCanvas = document.getElementById('webgl');  // get current canvas
  var nuGL = getWebGLContext(nuCanvas);             // and context:
  
  //Make canvas fill the top 3/4 of our browser window:
  nuCanvas.width = innerWidth;
  nuCanvas.height = innerHeight*3/4;
  //IMPORTANT!  need to re-draw screen contents
  draw(nuGL); 
}
