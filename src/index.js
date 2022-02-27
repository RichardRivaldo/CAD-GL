/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");

const inputModesSelector = document.querySelector("#input-modes");
const shapeTypesSelector = document.querySelector("#shape-types");
const shapeColorsSelector = document.querySelector("#shape-colors");
const sizeScaler = document.querySelector("#size-scaler");
const polygonEdgesInput = document.querySelector("#polygon-edges");
const loadButton = document.querySelector("#load-btn");
const saveButton = document.querySelector("#save-btn");

let inputMode = getElementValue(inputModesSelector);
let shapeType = getElementValue(shapeTypesSelector);
let shapeColor = getElementValue(shapeColorsSelector);
let size = getElementValue(sizeScaler);
let polygonEdges = parseInt(getElementValue(polygonEdgesInput));

let clicks = 0;
let vertices = [];
let isClicked = false;
let selectedObject = 0;
let selectedVertex = 0;

const allObjects = [];
const { xOrigin, yOrigin } = getOriginPoint();

const applyChange = () => {
    // Update value
    inputMode = getElementValue(inputModesSelector);
    shapeType = getElementValue(shapeTypesSelector);
    shapeColor = getElementValue(shapeColorsSelector);
    polygonEdges = getElementValue(polygonEdgesInput);

    sizeScaler.disabled = inputMode !== "resize";

    if (shapeType !== "polygon") {
        if (shapeType === "line") {
            polygonEdgesInput.value = 1;
            polygonEdges = 2;
        } else if (shapeType === "square" || shapeType === "rectangle") {
            polygonEdgesInput.value = 4;
            polygonEdges = 4;
        }
        polygonEdgesInput.disabled = true;
    } else {
        polygonEdgesInput.min = 3;
        if (polygonEdgesInput.value < 3)
            polygonEdgesInput.value = 3;
        polygonEdgesInput.disabled = false;
    }
};

const createObject = (type, vertexCount, vertices, color) => {
    const count = parseInt(vertexCount);
    return { shape: type, vertexCount: count, vertices, color };
};

const main = () => {
    // Get WebGL Context
    /** @type {WebGLRenderingContext} */
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas
    gl.clearColor(0.95, 0.92, 0.93, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render all objects
    render(gl, allObjects);

    const addCurrentVertex = (event) => {
        const cursorPosition = getCursorPosition(event);
        vertices.push(cursorPosition.x, cursorPosition.y, 0.0);
    };

    const resetInput = () => {
        vertices = [];
        clicks = 0;
    };

    const changeColor = (cursorPosition) => {
        const nearestObject = getNearestObject(
            cursorPosition.x,
            cursorPosition.y,
            allObjects
        );
        console.log(allObjects[nearestObject])
        allObjects[nearestObject].color = shapeColor;
    };

    const resize = () => {
        // Update slider
        size = getElementValue(sizeScaler) / 100;

        // Line resizing
        if (allObjects[selectedObject].shape === "line") {
            const currentVertices = allObjects[selectedObject].vertices;
            const x0 = currentVertices[0];
            const y0 = currentVertices[1];
            const x1 = currentVertices[3];
            const y1 = currentVertices[4];

            // Update last coordinate in the buffer and apply scaling
            allObjects[selectedObject].vertices[3] = x0 + size * (x1 - x0);
            allObjects[selectedObject].vertices[4] = y0 + size * (y1 - y0);
        }
        if (allObjects[selectedObject].shape === "polygon") {
            // Find center point of object
            const currentVertices = allObjects[selectedObject].vertices;
            var xmax = -1;
            var ymax = -1;
            var xmin = 1;
            var ymin = 1;
            for (i = 0; i < currentVertices.length; i+=3) {
                if (currentVertices[i] > xmax) xmax = currentVertices[i];
                if (currentVertices[i] < xmin) xmin = currentVertices[i];
                if (currentVertices[i+1] > ymax) ymax = currentVertices[i+1];
                if (currentVertices[i+1] < ymin) ymin = currentVertices[i+1];
            }
            xmid = xmin + 0.5 * (xmax - xmin);
            ymid = xmin + 0.5 * (xmax - xmin);
            // Scale each vertice according to center point
            for (i = 0; i < currentVertices.length; i+=3) {
                allObjects[selectedObject].vertices[i] = xmid + size * (currentVertices[i] - xmid);
                allObjects[selectedObject].vertices[i+1] = ymid + size * (currentVertices[i+1] - ymid);
            }
        }
        if (allObjects[selectedObject].shape === "square") {
            // Find x, y original position
            const currentVertices = allObjects[selectedObject].vertices;
            var x1 = currentVertices[3];
            var y1 = currentVertices[4];
    
            allObjects[selectedObject].vertices = [
                 x1+size*0.53, y1, 0, // ini tetep
                 x1, y1,0,
                 x1+size*0.53, y1-size,0,
                 x1, y1-size,0
             ]
            
        }
        if (allObjects[selectedObject].shape === "rectangle") {
            // Find x, y original positon
            const currentVertices = allObjects[selectedObject].vertices;
            var x1 = currentVertices[3];
            var y1 = currentVertices[4];
    
            allObjects[selectedObject].vertices = [
                 x1+size*0.53, y1, 0, // ini tetep
                 x1, y1,0,
                 x1+size*0.53, y1-size,0,
                 x1, y1-size,0
             ]
        }

        // Render and reset input value
        render(gl, allObjects);
        sizeScaler.value = 100;
    };

    const renderMovingObject = (event) => {
        if (isClicked) {
            const cursorPosition = getCursorPosition(event);
            allObjects[selectedObject].vertices[selectedVertex] = cursorPosition.x;
            allObjects[selectedObject].vertices[selectedVertex + 1] = cursorPosition.y;
            render(gl, allObjects);
        }
    };
    

    const handleDraw = (gl, event) => {
        let enoughVertex = (
            shapeType === "polygon" && clicks === polygonEdges - 1 ||
            shapeType !== "polygon" && clicks === 1
        );

        let squareVertex  = (
            shapeType === "square" && clicks === 1 )
            let rectangleVertex  = (
                shapeType === "rectangle" && clicks === 1 )
        
        if (squareVertex){
                //config // console.log(gl)
                // console.log(event)
                // console.log(vertices)

                let currPos = getCursorPosition(event, canvas);
                let x1 = currPos.x; let y1 = currPos.y;
                size = getElementValue(sizeScaler) / 100;
                    vertices = [
                        x1+size*0.53, y1, 0,
                        x1, y1,0,
                        x1+size*0.53, y1-size,0,
                        x1, y1-size,0
                    ]
                      console.log(vertices)
                    //   clicks = 0
             }

             if (rectangleVertex){
                //config // console.log(gl)
                // console.log(event)
                console.log(vertices)

                let currPos = getCursorPosition(event, canvas);
                let x1 = currPos.x; let y1 = currPos.y;
                size = getElementValue(sizeScaler) / 100;
                    vertices = [
                        x1+size, y1, 0,
                        x1, y1,0,
                        x1+size, y1-size,0,
                        x1, y1-size,0
                    ]
                      console.log(vertices)
                    //   clicks = 0
             }
        
        if (!enoughVertex) {
            addCurrentVertex(event);
            clicks += 1;
        } else {
            if (shapeType === "square" || shapeType === "rectangle") {
                // Adjustments
            } else {
                addCurrentVertex(event);
            }

            const newObject = createObject(shapeType, polygonEdges, vertices, shapeColor);
            allObjects.push(newObject);
            console.log(vertices)
            console.log(newObject)
            if (allObjects){
                console.log(allObjects)
            }
           

            render(gl, allObjects);
            resetInput();
        }
    };

    const handleChangeColor = (event) => {
        // resetInput();
        const cursorPosition = getCursorPosition(event);
        changeColor(cursorPosition);

        render(gl, allObjects);
        resetInput();
    };

    const handleChangeSize = (event) => {
        const cursorPosition = getCursorPosition(event);
        selectedObject = getNearestObject(cursorPosition.x, cursorPosition.y, allObjects);
    };

    const handleMovePoint = (event) => {
        const cursorPosition = getCursorPosition(event);
        if (!isClicked) {
            selectedObject = getNearestObject(
                cursorPosition.x,
                cursorPosition.y,
                allObjects
            );
            selectedVertex = getNearestVertex(
                cursorPosition.x,
                cursorPosition.y,
                allObjects[selectedObject]
            );

            isClicked = true;
        } else {
            allObjects[selectedObject].vertices[selectedVertex] = cursorPosition.x;
            allObjects[selectedObject].vertices[selectedVertex + 1] = cursorPosition.y;

            render(gl, allObjects);
            isClicked = false;
        }
    };

    const canvasHandler = (event) => {
        applyChange();
        if (inputMode === "draw") {
            handleDraw(gl, event);
        } else if (inputMode === "fill-color") {
            handleChangeColor(event);
        } else if (inputMode === "resize") {
            handleChangeSize(event);
        } else if (inputMode === "move-vertex") {
            handleMovePoint(event);
        }
    };

    const saveData = () => {
        const a = document.createElement("a");
        const file = new Blob([JSON.stringify(allObjects)], { type: "json" });
        a.href = URL.createObjectURL(file);
        a.download = "data.json";
        a.click();
        URL.revokeObjectURL(a.href);
    };
    
    const loadData = (event) => {
        const file = event.target.files[0];
        var reader = new FileReader();
        reader.addEventListener("load", function (event) {
          let data = event.target.result;
          data = JSON.parse(data);
          allObjects.push(...data);
          render(gl, allObjects);
        });
        reader.readAsBinaryString(file);
    };

    // Setup HTML Elements
    setEventListener(sizeScaler, "change", resize);
    setEventListener(canvas, "mousedown", canvasHandler);
    setEventListener(canvas, "mousemove", renderMovingObject);
    setEventListener(saveButton, "mousedown", saveData);
    setEventListener(loadButton, "change", loadData);
};

main();
