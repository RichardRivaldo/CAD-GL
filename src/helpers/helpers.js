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
