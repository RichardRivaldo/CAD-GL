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
        let isNotLine =
            shapeType === "square" ||
            shapeType === "rectangle" ||
            shapeType === "polygon";
        let needMoreVertex = !(
            clicks === polygonEdges - 1 ||
            (isNotLine && clicks === 1)
        );

        if (needMoreVertex) {
            addCurrentVertex(event);
            clicks += 1;
        } else {
            if (isNotLine) {
                // Change the event here
            } else {
                addCurrentVertex(event);
            }

            const newObject = createObject(shapeType, polygonEdges, vertices, shapeColor);
            allObjects.push(newObject);

            render(gl, allObjects);
            resetInput();
        }
    };

    const handleChangeColor = (event) => {
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

    // Setup HTML Elements
    setEventListener(sizeScaler, "change", resize);
    setEventListener(canvas, "mousedown", canvasHandler);
    setEventListener(canvas, "mousemove", renderMovingObject);
};

main();
