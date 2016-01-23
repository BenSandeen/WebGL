function initVertexBuffers(gl) {
//==============================================================================
  // call the functions to create the (global) vertex arrays for each primitive
  makeHex();
  makeRect();
  makeGroundGrid();
  makeSphere();
  makeAxes();

  var size=(hexVerts.length+rectVerts.length+gndVerts.length
           +sphVerts.length+axesVerts.length);

  // create a new "master" array to host both vertex arrays, which
  // will be navigated with proper stride and offset
  var nn = size / floatsPerVertex;
  var colorShapes = new Float32Array(size);

  hexStart = 0;
  for (i=0,j=0;j<hexVerts.length; i++,j++) {
    colorShapes[i] = hexVerts[j];
  }
  rectStart = i;
  for (j=0;j<rectVerts.length; i++,j++) {
    colorShapes[i] = rectVerts[j];
  }
  gndStart = i;
  for (j=0;j<gndVerts.length; i++,j++) {
    colorShapes[i] = gndVerts[j];
  }
  sphStart = i;
  for (j=0;j<sphVerts.length; i++,j++) {
    colorShapes[i] = sphVerts[j];
  }
  axesStart = i;
  for (j=0;j<axesVerts.length; i++,j++) {
    colorShapes[i] = axesVerts[j];
  }

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  // gets the vertex locations
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * floatsPerVertex, 0);
        //  glVertexAttributePointer (
        //      index == which attribute variable will we use?
        //      size == how many dimensions for this attribute: 1,2,3 or 4?
        //      type == what data type did we use for those numbers?
        //      isNormalized == are these fixed-point values that we need
        //            normalize before use? true or false
        //      stride == #bytes (of other, interleaved data) between OUR values?
        //      pointer == offset; how many (interleaved) values to skip to reach
        //          our first value?
        //        )
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);
  
  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get storage location of a_Normal');
    return -1;
  }

  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 7);
  gl.enableVertexAttribArray(a_Normal);
  
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }

  // gets the vertex colors
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 4)
  gl.enableVertexAttribArray(a_Color);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function makeHex() {
  var cos30 = Math.cos(30*(Math.PI)/180);
  hexVerts = new Float32Array([
//==========================SIDES OF HEXAGON============================

    -.25, -1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// A
    .25,  -1.0, cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// B
    -.25,  1.0, cos30/2,  1.0,    1.0,   0.0,  0.0,0,0,-1,// H
    .25,   1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// I
    .25,  -1.0, cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// B
   
    .5,   -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// C
    .25,   1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// I
    .5,    1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// J
    .5,   -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// C

    .25,  -1.0,-cos30/2,  1.0,    0.0,   1.0,  0.0,0,0,-1,// D
    .5,    1.0, 0,        1.0,    1.0,   0.0,  0.0,0,0,-1,// J
    .25,   1.0,-cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// K
    .25,  -1.0,-cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// D

    -.25, -1.0,-cos30/2,  1.0,    0.0,   1.0,  1.0,0,0,-1,// E
    .25,   1.0,-cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// K
    -.25,  1.0,-cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// L
    -.25, -1.0,-cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// E

    -.5,  -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// F
    -.25,  1.0,-cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// L
    -.5,   1.0, 0,        1.0,    1.0,   0.0,  0.0,0,0,-1,// G
    -.5,  -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// F

    -.25, -1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// A
    -.5,   1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// G
    -.25,  1.0, cos30/2,  1.0,    1.0,   0.0,  0.0,0,0,-1,// H
    -.25, -1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// A

//==========================ENDS OF HEXAGON============================

    // TOP END
    
    -.25, -1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// A
    0.0,  -1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    .25,  -1.0, cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// B

    .25,  -1.0, cos30/2,  1.0,    1.0,   0.0,  0.0,0,0,-1,// B
    0.0,  -1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    .5,   -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// C

    .5,   -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// C
    0.0,  -1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    .25,  -1.0,-cos30/2,  1.0,    0.0,   1.0,  0.0,0,0,-1,// D

    .25,  -1.0,-cos30/2,  1.0,    0.0,   1.0,  0.0,0,0,-1,// D
    0.0,  -1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    -.25, -1.0,-cos30/2,  1.0,    0.0,   1.0,  1.0,0,0,-1,// E

    -.25, -1.0,-cos30/2,  1.0,    0.0,   1.0,  1.0,0,0,-1,// E
    0.0,  -1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    -.5,  -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// F

    -.5,  -1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// F
    0.0,  -1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    -.25, -1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// A  

    // BOTTOM END

    -.25,  1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// A
    0.0,   1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    .25,   1.0, cos30/2,  1.0,    0.0,   0.0,  1.0,0,0,-1,// B

    .25,   1.0, cos30/2,  1.0,    1.0,   0.0,  0.0,0,0,-1,// B
    0.0,   1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    .5,    1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// C

    .5,    1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// C
    0.0,   1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    .25,   1.0,-cos30/2,  1.0,    0.0,   1.0,  0.0,0,0,-1,// D

    .25,   1.0,-cos30/2,  1.0,    0.0,   1.0,  0.0,0,0,-1,// D
    0.0,   1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    -.25,  1.0,-cos30/2,  1.0,    0.0,   1.0,  1.0,0,0,-1,// E

    -.25,  1.0,-cos30/2,  1.0,    0.0,   1.0,  1.0,0,0,-1,// E
    0.0,   1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    -.5,   1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// F

    -.5,   1.0, 0,        1.0,    0.0,   1.0,  0.0,0,0,-1,// F
    0.0,   1.0, 0.0,      1.0,    0.0,   0.0,  0.0,0,0,-1,// CENTER POINT
    -.25,  1.0, cos30/2,  1.0,    1.0,   1.0,  1.0,0,0,-1,// A  
  ]);
}

function makeRect() {
  rectVerts = new Float32Array([
    -.5, -.15, .5, 1.0, 0,1,0,0,-1,0,
    .5,  -.15, .5, 1.0, 1,0,0,-1,0,0,  // FRONT
    -.5,  .15, .5, 1.0, 0,1,1,0,0,-1,
    .5,   .15, .5, 1.0, 0,1,1,0,0,-1,
    
    .5,  -.15, .5, 1.0, 1,0,1,0,0,-1,
    .5,  -.15,-.5, 1.0, 1,0,0,-1,0,0,  // RIGHT
    .5,   .15, .5, 1.0, 0,0,1,0,0,-1,
    .5,   .15,-.5, 1.0, 1,1,1,0,0,-1,

    .5,  -.15,-.5, 1.0, 1,0,0,-1,0,0,
    -.5, -.15,-.5, 1.0, 1,0,1,0,0,-1,  // BACK
    .5,   .15,-.5, 1.0, 1,1,1,0,0,-1,
    -.5,  .15,-.5, 1.0, 0,1,0,0,-1,0,

    -.5, -.15,-.5, 1.0, 1,0,1,0,0,-1,
    -.5, -.15, .5, 1.0, 0,1,0,0,-1,0,  // LEFT
    -.5,  .15,-.5, 1.0, 1,1,0,0,-1,0,
    -.5,  .15, .5, 1.0, 0,1,1,0,0,-1,
    -.5, -.15, .5, 1.0, 0,1,0,0,-1,0,

   -.5,  -.15,-.5, 1.0, 1,0,1,0,0,-1,  // BOTTOM
    .5,  -.15, .5, 1.0, 1,0,1,0,0,-1,
    .5,  -.15,-.5, 1.0, 1,1,0,0,-1,0,
   -.5,  -.15,-.5, 1.0, 1,0,1,0,0,-1,

    -.5,  .15,-.5, 1.0, 0,1,0,0,-1,0,  // TOP
    -.5,  .15, .5, 1.0, 0,1,1,0,0,-1,
    .5,   .15, .5, 1.0, 0,1,1,0,0,-1,
    .5,  .15, -.5, 1.0, 1,1,1,0,0,-1,
    -.5,  .15,-.5, 1.0, 0,1,0,0,-1,0,
  ]);
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([0.8, 0.0, 0.3]);  // bright yellow
  var yColr = new Float32Array([0.9, 0.9, 0.9]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = xColr[0];     // red
    gndVerts[j+4] = xColr[1];     // grn
    gndVerts[j+5] = xColr[2];     // blu
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = yColr[0];     // red
    gndVerts[j+4] = yColr[1];     // grn
    gndVerts[j+5] = yColr[2];     // blu
  }
}


function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 27; // # of vertices around the top edge of the slice
                      // (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);  // North Pole: light gray
  var equColr = new Float32Array([0.8, 0.2, 0.7]);  // Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 
                    // each slice requires 2*sliceVerts vertices except 1st and
                    // last ones, which require only 2*sliceVerts-1.
                    
  // Create dome-shaped top slice of sphere at z=+1
  // s counts slices; v counts vertices; 
  // j counts array elements (vertices * elements per vertex)
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { // for each slice of the sphere,
    // find sines & cosines for top and bottom of this slice
    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);
    // go around the entire slice, generating TRIANGLE_STRIP verts
    // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) { 
      if(v%2==0)
      {       // put even# vertices at the the slice's top edge
              // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
              // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
        sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphVerts[j+2] = cos0;   
        sphVerts[j+3] = 1.0;      
      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+2] = cos1;                                       // z
        sphVerts[j+3] = 1.0;                                        // w.   
      }
      if(s==0) {  // finally, set some interesting colors for vertices:
        sphVerts[j+4]=topColr[0]; 
        sphVerts[j+5]=topColr[1]; 
        sphVerts[j+6]=topColr[2]; 
        }
      else if(s==slices-1) {
        sphVerts[j+4]=botColr[0]; 
        sphVerts[j+5]=botColr[1]; 
        sphVerts[j+6]=botColr[2]; 
      }
      else {
          sphVerts[j+4]=equColr[0];//Math.random();// equColr[0];
          sphVerts[j+5]=equColr[1];//Math.random();// equColr[1];
          sphVerts[j+6]=equColr[2];//Math.random();// equColr[2];
      }
      sphVerts[j+7]=sphVerts[j ];
      sphVerts[j+8]=sphVerts[j+1];
      sphVerts[j+9]=sphVerts[j+2];
    }
  }
}

function makeAxes() {
  axesVerts = new Float32Array([
  0.0, 0.0, 0.0,      1.0,    0.0,   1.0,  0.0,0,0,-1,
  1.0, 0.0, 0.0,      1.0,    0.0,   1.0,  0.0,0,0,-1,
  0.0, 0.0, 0.0,      1.0,    1.0,   0.0,  0.0,0,0,-1,
  0.0, 1.0, 0.0,      1.0,    1.0,   0.0,  0.0,0,0,-1,
  0.0, 0.0, 0.0,      1.0,    0.0,   0.0,  1.0,0,0,-1,
  0.0, 0.0, 1.0,      1.0,    0.0,   0.0,  1.0,0,0,-1,
  ]);
}