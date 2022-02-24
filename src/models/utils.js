// Basic vertex and fragment shader for 2D Objects
const vertexShader = `attribute vec3 a_position;
                        attribute vec3 a_color;
                        varying vec3 v_color;
                        void main(void) {
                            gl_Position = vec4(a_position, 1.0);
                            v_color = a_color;
                        }`;

const fragmentShader = `precision mediump float;
                        varying vec3 v_color;
                        void main(void) {
                            gl_FragColor = vec4(v_color, 1.0);
                        }`;

// Color codes for available colors (Black, RGB, CMY)
const colorCodes = {
    black: [0.0, 0.0, 0.0],
    red: [1.0, 0.0, 0.0],
    green: [0.0, 1.0, 0.0],
    blue: [0.0, 0.0, 1.0],
    cyan: [0.0, 1.0, 1.0],
    magenta: [1.0, 0.0, 1.0],
    yellow: [1.0, 1.0, 0.0],
};

const compileShader = (gl, shaderType, shader) => {
    // Create, load, and compile the shader
    let glShader = gl.createShader(shaderType);
    gl.shaderSource(glShader, shader);
    gl.compileShader(glShader);

    if (!gl.getShaderParameter(glShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(glShader));
        return null;
    }

    return glShader;
};

const createProgram = (gl) => {
    // Create program and attach shaders to the program
    const program = gl.createProgram();
    const vShader = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);

    gl.linkProgram(program);
    gl.useProgram(program);

    return program;
};

const createBuffer = (gl, bufferType, bufferData) => {
    // Creata and bind buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, bufferData, gl.STATIC_DRAW);
    gl.bindBuffer(bufferType, null);

    return buffer;
};

const sendDataToShader = (gl, program, attributeName, bufferSize) => {
    // Find attribute location and enable the attribute array
    const location = gl.getAttribLocation(program, attributeName);
    gl.vertexAttribPointer(location, bufferSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
};

const formGeometry = (objects) => {
    // Initialize empty topologies array
    let colors = [];
    let indices = [];
    let vertices = [];

    objects.forEach((object) => {
        // Filled static color for each vertex of the object (no interpolation)
        for (let i = 0; i < object.vertexCount; i++) {
            colors = colors.concat(colorCodes[object.color]);
        }

        // Add the vertices of the object to list of all objects' vertices
        vertices = vertices.concat(object.vertices);

        // Add indices numbering
        let indicesTail = indices.length;
        for (let i = 0; i < object.vertexCount; ++i) {
            indices.push(indicesTail + i);
        }
    });

    return { colors, indices, vertices };
};

const renderObjects = (gl, objects) => {
    // Enable depth test to allow overlapping objects
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Initialize default arguments
    let bufferOffset = 0;
    let primitiveType = gl.LINES;
    const bufferPrimitive = gl.UNSIGNED_SHORT;

    objects.forEach((object) => {
        // Determine the drawing method for each type of object
        const shape = object.shape;

        if (shape === "line") {
            primitiveType = gl.LINES;
        } else if (shape === "polygon") {
            primitiveType = gl.TRIANGLE_FAN;
        } else {
            primitiveType = gl.TRIANGLE_STRIP;
        }

        // Draw the object and move the offset
        const vertexCount = object.vertexCount;
        gl.drawElements(primitiveType, vertexCount, bufferPrimitive, bufferOffset * 2);
        bufferOffset += vertexCount;
    });
};

const render = (gl, objects) => {
    // Create GL Program
    const program = createProgram(gl);

    // Form the topology of the geometry
    const { colors, indices, vertices } = formGeometry(objects);

    // Create buffers
    const colorBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(colors));
    const indexBuffer = createBuffer(
        gl,
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices)
    );
    const vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vertices));

    // Send data buffer by buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    sendDataToShader(gl, program, "a_color", 3);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    sendDataToShader(gl, program, "a_position", 3);

    // Render all objects
    renderObjects(gl, objects);
};
