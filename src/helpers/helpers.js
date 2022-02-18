const calculateDistance = (x1, y1, x2, y2) =>
    Math.pow(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2), 0.5);

const getNearestObject = (x, y, objects) => {
    const objDistMap = [];

    objects.forEach((object, index) => {
        for (let i = 0; i < object.vertexCount; i += 3) {
            const objectDistance = calculateDistance(
                x,
                y,
                object.vertices[i],
                object.vertices[i + 1]
            );
            objDistMap.push({
                index,
                objectDistance,
            });
        }
    });
    const nearestObject = objDistMap.reduce((res, obj) =>
        obj.objectDistance < res.objectDistance ? obj : res
    );

    return nearestObject.index;
};

const getElementValue = (element) => {
    return element.value;
};

const getOriginPoint = (canvas) => {
    return {
        xOrigin: 512,
        yOrigin: 285,
    };
};

const getCursorPosition = (event) => {
    const clientRect = canvas.getBoundingClientRect();

    const cursorX = event.clientX - clientRect.left;
    const cursorY = event.clientY - clientRect.top;

    return {
        x: (cursorX - xOrigin) / xOrigin,
        y: ((cursorY > yOrigin ? -1 : 1) * Math.abs(cursorY - yOrigin)) / yOrigin,
    };
};

const setEventListener = (element, eventType, cb) => {
    element.addEventListener(eventType, cb);
};
