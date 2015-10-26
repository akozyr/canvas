var img;
var canvas;
var imgWidth, imgHeight;

$(document).ready(function()
{
    img = document.getElementById('inputImage');
    img.onload = function()
    {
        canvas = document.getElementById('canvas');
        canvas.width = imgWidth = img.width;
        canvas.height = imgHeight = img.height;
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        var imageData = context.getImageData(0, 0, imgWidth, imgHeight);

        // imageData = Grayscale(imageData);
        // imageData = Gaussian(imageData);
        
        imageData = Canny(imageData);

        // imageData = Svg(imageData);

        var containerSvg = document.getElementById('svg');
        // containerSvg.innerHTML = Svg(imageData);

        context.putImageData(imageData, 0, 0);
    }

    img.src = "/img/4.bmp";
});

var Canny = function(imageData)
{
    var inputPixels = new Uint8ClampedArray(imageData.data);
    var outputPixels = imageData.data;
    var arrayOfAngles = [];

    var visitedMap = [];
    var edges = [];

    function getPixel(x, y)
    {
        return inputPixels[4 * (x + y * imgWidth)];
    }

    function setPixel(x, y, color)
    {
        var index = 4 * (x + y * imgWidth);

        outputPixels[index] = color;
        outputPixels[index + 1] = color;
        outputPixels[index + 2] = color;
    }

    function getGradient(x, y)
    {
        // const LIMIT_VALUE = 180;
        const GY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        const GX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];

        var sumGx, sumGy;
        var buf1, buf2;
        var parameters;

        buf1 = GY[0] * getPixel(x - 1, y - 1);
        buf2 = getPixel(x + 1, y + 1);

        sumGy = buf1 + GY[1] * getPixel(x, y - 1) + GY[2] * getPixel(x + 1, y - 1) +
                GY[6] * getPixel(x - 1, y + 1) + GY[7] * getPixel(x, y + 1) + buf2;

        sumGx = buf1 + GX[2] * getPixel(x + 1, y - 1) + 
                GX[3] * getPixel(x - 1, y) + GX[5] * getPixel(x + 1, y) +
                GX[6] * getPixel(x - 1, y + 1) + buf2;

        var ratio = sumGy / sumGx;
        var negative = false;

        if (ratio < 0 || ratio === -0) {
            negative = true;
        }

        sumGy = Math.abs(sumGy);
        sumGx = Math.abs(sumGx);

        var result = sumGy + sumGx;

        if (result !== 0) {
            var angle = Math.atan(Math.abs(ratio)) * 180 / Math.PI;

            angle = Math.abs(angle);
/*
            if (Math.abs(45 - angle) <= 22) {
                angle = 45;
            } else if (Math.abs(90 - angle) <= 22) {
                angle = 90;
            } else if (Math.abs(135 - angle) <= 22) {
                angle = 135;
            } else {
                angle = 0;
            }
*/

            if (angle < 22.5) {
                angle = 0;
            } else if (22.5 <= angle && angle < 67.5) {
                angle = 45;
            } else if (67.5 <= angle && angle < 112.5) {
                angle = 90;
            } else if (112.5 <= angle && angle < 157.5) {
                angle = 135;
            } else {
                angle = 0;
            }

            if (negative) {
                angle *= -1;
            }
        } else {
            var angle = 0;
        }

        return [result, angle];
    }

    function suppress(index1, index2, index3)
    {
        const LIMIT_VALUE = 150;
        var result;

        var a = outputPixels[index1];
        var b = outputPixels[index2];
        var c = outputPixels[index3];
        
        if (outputPixels[index1] > outputPixels[index2]) {
            outputPixels[index2] = 0;
            outputPixels[index2 + 1] = 0;
            outputPixels[index2 + 2] = 0;
            result = outputPixels[index1];
        } else {
            outputPixels[index1] = 0;
            outputPixels[index1 + 1] = 0;
            outputPixels[index1 + 2] = 0;
            result = outputPixels[index2];
        }

        if (outputPixels[index3] >= result) {
            outputPixels[index1] = 0;
            outputPixels[index1 + 1] = 0;
            outputPixels[index1 + 2] = 0;
            outputPixels[index2] = 0;
            outputPixels[index2 + 1] = 0;
            outputPixels[index2 + 2] = 0;
        } else {
            outputPixels[index3] = 0;
            outputPixels[index3 + 1] = 0;
            outputPixels[index3 + 2] = 0;
            
        }
        
        /*
        if (b >= a && b >= c) {
            outputPixels[index1] = 0;
            outputPixels[index1 + 1] = 0;
            outputPixels[index1 + 2] = 0;
            outputPixels[index3] = 0;
            outputPixels[index3 + 1] = 0;
            outputPixels[index3 + 2] = 0;
        } else {
            outputPixels[index2] = 0;
            outputPixels[index2 + 1] = 0;
            outputPixels[index2 + 2] = 0;
        }
        */
        /*
        if (arrayOfAngles[index1] == arrayOfAngles[index2] && arrayOfAngles[index2] == arrayOfAngles[index3]) {
            if (b >= a && b >= c) {
                outputPixels[index1] = 0;
                outputPixels[index1 + 1] = 0;
                outputPixels[index1 + 2] = 0;
                outputPixels[index3] = 0;
                outputPixels[index3 + 1] = 0;
                outputPixels[index3 + 2] = 0;
            } else {
                outputPixels[index2] = 0;
                outputPixels[index2 + 1] = 0;
                outputPixels[index2 + 2] = 0;
            }
        } else if (arrayOfAngles[index1] != arrayOfAngles[index2] && arrayOfAngles[index2] == arrayOfAngles[index3]) {
            if (outputPixels[index2] > outputPixels[index3]) {
                outputPixels[index3] = 0;
                outputPixels[index3 + 1] = 0;
                outputPixels[index3 + 2] = 0;
            } else {
                outputPixels[index2] = 0;
                outputPixels[index2 + 1] = 0;
                outputPixels[index2 + 2] = 0;
            }
        } else if (arrayOfAngles[index1] == arrayOfAngles[index2] && arrayOfAngles[index2] != arrayOfAngles[index3]) {
            if (outputPixels[index1] > outputPixels[index2]) {
                outputPixels[index2] = 0;
                outputPixels[index2 + 1] = 0;
                outputPixels[index2 + 2] = 0;
            } else {
                outputPixels[index1] = 0;
                outputPixels[index1 + 1] = 0;
                outputPixels[index1 + 2] = 0;
            }
        } else {
            if (Math.abs(arrayOfAngles[index2]) < Math.abs(arrayOfAngles[index3]) || arrayOfAngles[index1] === undefined) {
                outputPixels[index2] = 0;
                outputPixels[index2 + 1] = 0;
                outputPixels[index2 + 2] = 0;
            }
        }
        */
    }

    function suppressNonMaximum(x, y)
    {
        var index = 4 * (x + y * imgWidth);

        if (x == 13 && y == 17) {
            console.log('');
        }

        if (outputPixels[index] !== 0) {
            /*if (arrayOfAngles[4 * (x + y * imgWidth)] === -0) {
                suppress(index + 4, index, index - 4);
            } else {*/
                if (arrayOfAngles[4 * (x + y * imgWidth)] < 0) {
                    arrayOfAngles[4 * (x + y * imgWidth)] += 180;
                }

                switch (arrayOfAngles[4 * (x + y * imgWidth)]) {
                    case 0:
                        suppress(index + 4 * imgWidth, index, index - 4 * imgWidth);
                        break;
                    case 45:
                        suppress(index + 4 * (imgWidth + 1), index, index - 4 * (imgWidth + 1));
                        break;
                    case 90:
                        suppress(index - 4, index, index + 4);
                        break;
                    case 135:
                        suppress(index + 4 * (imgWidth - 1), index, index - 4 * (imgWidth - 1));
                        break;
                    default:
                        break;
                }
            // }
        }
    }

    function findStrongEdge(x, y)
    {
        const minThreshold = 100;
        const maxThreshold = 200;

        if (x == 174 && y == 133) {
            console.log('');
        }

        var index = 4 * (x + y * imgWidth);

        if (outputPixels[index] > minThreshold) {
            edges[index] = 2;

            if (outputPixels[index] > maxThreshold) {
                edges[index] = 1;
            }
        } else {
            edges[index] = 0;
        }
    }

    function hysteresisThresholding(x, y)
    {
        var index = 4 * (x + y * imgWidth);

        if (x == 111 && y == 77) {
            console.log('');
        }

        if (!visitedMap[index]) {
            if (edges[index] == 1) {
                outputPixels[index] = 255;
                outputPixels[index + 1] = 255;
                outputPixels[index + 2] = 255;
                findEdge(x, y);
                visitedMap[index] = 1;
            } else if (edges[index] == 0) {
                outputPixels[index] = 0;
                outputPixels[index + 1] = 0;
                outputPixels[index + 2] = 0;
                visitedMap[index] = 1;
            }
        }
    }

    function findEdge(x, y)
    {
        var index = 4 * (x + y * imgWidth);
       
        if (visitedMap[index] == 1) {
            return;
        }
        
        if (edges[index - 4 * (imgWidth + 1)] === 2) {
            edges[index - 4 * (imgWidth + 1)] = 0;
            outputPixels[index - 4 * (imgWidth + 1)] = 255;
            outputPixels[index - 4 * (imgWidth + 1) + 1] = 255;
            outputPixels[index - 4 * (imgWidth + 1) + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x - 1, y - 1);
            return;
        }

        if (edges[index - 4 * imgWidth] === 2) {
            edges[index - 4 * imgWidth] = 0;
            outputPixels[index - 4 * imgWidth] = 255;
            outputPixels[index - 4 * imgWidth + 1] = 255;
            outputPixels[index - 4 * imgWidth + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x, y - 1);
            return;
        }

        if (edges[index - 4 * (imgWidth - 1)] === 2) {
            edges[index - 4 * (imgWidth - 1)] = 0;
            outputPixels[index - 4 * (imgWidth - 1)] = 255;
            outputPixels[index - 4 * (imgWidth - 1) + 1] = 255;
            outputPixels[index - 4 * (imgWidth - 1) + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x + 1, y - 1);
            return;
        }

        if (edges[index - 4] === 2) {
            edges[index - 4] = 0;
            outputPixels[index - 4] = 255;
            outputPixels[index - 4 + 1] = 255;
            outputPixels[index - 4 + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x - 1, y);
            return;
        }

        if (edges[index + 4] === 2) {
            edges[index + 4] = 0;
            outputPixels[index + 4] = 255;
            outputPixels[index + 4 + 1] = 255;
            outputPixels[index + 4 + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x + 1, y);
            return;
        }

        if (edges[index + 4 * (imgWidth - 1)] === 2) {
            edges[index + 4 * (imgWidth - 1)] = 0;
            outputPixels[index + 4 * (imgWidth - 1)] = 255;
            outputPixels[index + 4 * (imgWidth - 1) + 1] = 255;
            outputPixels[index + 4 * (imgWidth - 1) + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x - 1, y + 1);
            return;
        }

        if (edges[index + 4 * imgWidth] === 2) {
            edges[index + 4 * imgWidth] = 0;
            outputPixels[index + 4 * imgWidth] = 255;
            outputPixels[index + 4 * imgWidth + 1] = 255;
            outputPixels[index + 4 * imgWidth + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x, y + 1);
            return;
        }

        if (edges[index + 4 * (imgWidth + 1)] === 2) {
            edges[index + 4 * (imgWidth + 1)] = 0;
            outputPixels[index + 4 * (imgWidth + 1)] = 255;
            outputPixels[index + 4 * (imgWidth + 1) + 1] = 255;
            outputPixels[index + 4 * (imgWidth + 1) + 2] = 255;
            visitedMap[index] = 1;
            findEdge(x + 1, y + 1);
            return;
        }

        return;
    }

    for (var x = 1; x < imgWidth - 1; x++) {
        for (var y = 1; y < imgHeight - 1; y++) {        
            parameters = getGradient(x, y);
            setPixel(x, y, parameters[0]);

            if (parameters[0] !== 0) {
                arrayOfAngles[4 * (x + y * imgWidth)] = parameters[1];
            }
        }
    }
/*
    for (var y = 1; y < imgHeight - 1; y++) {
        $('#angles').append('<tr></tr>');
        for (var x = 1; x < imgWidth - 1; x++) {
            var angle = arrayOfAngles[4 * (x + y * imgWidth)];
            if (angle === -0) {
                angle = '-0';
            } else if (angle === undefined) {
                angle = '*';
            }
            var str = angle + ':' + outputPixels[4 * (x + y * imgWidth)];
            $('#angles > tbody > tr:last').append('<td name="' + x + ':' + y + '">' + str + '</td>');
        }
    }
*/

    for (var x = 1; x < imgWidth - 1; x++) {
        for (var y = 1; y < imgHeight - 1; y++) {
            suppressNonMaximum(x, y);
        }
    }


    for (var x = 1; x < imgWidth - 1; x++) {
        for (var y = 1; y < imgHeight - 1; y++) {
            findStrongEdge(x, y);
        }
    }

    for (var x = 1; x < imgWidth - 1; x++) {
        for (var y = 1; y < imgHeight - 1; y++) {
            hysteresisThresholding(x, y);
        }
    }

    for (var x = 1; x < imgWidth - 1; x++) {
        for (var y = 1; y < imgHeight - 1; y++) {
            var index = 4 * (x + y * imgWidth);
            if (visitedMap[index] === undefined) {
                outputPixels[index] = 0;
                outputPixels[index + 1] = 0;
                outputPixels[index + 2] = 0;
            }
        }
    }

    return imageData;
};

var Gaussian = function(imageData)
{
    var inputPixels = new Uint8ClampedArray(imageData.data);
    var outputPixels = imageData.data;

    function getPixel(x, y)
    {
        return inputPixels[4 * (x + y * imgWidth)];
    }

    function setPixel(x, y, color)
    {
        var index = 4 * (x + y * imgWidth);

        outputPixels[index] = color;
        outputPixels[index + 1] = color;
        outputPixels[index + 2] = color;
    }

    function getSmoothValue(x, y)
    {
        const KERNEL = [
            2, 4, 5, 4, 2,
            4, 9, 12, 9, 4,
            5, 12, 15, 12, 5,
            4, 9, 12, 9, 4,
            2, 4, 5, 4, 2
        ];

        var result = (KERNEL[0] * getPixel(x - 2, y - 2) + KERNEL[1] * getPixel(x - 1, y - 2) + KERNEL[2] * getPixel(x, y - 2) + KERNEL[3] * getPixel(x + 1, y - 2) + KERNEL[4] * getPixel(x + 2, y - 2) +
                      KERNEL[5] * getPixel(x - 2, y - 1) + KERNEL[6] * getPixel(x - 1, y - 1) + KERNEL[7] * getPixel(x, y - 1) + KERNEL[8] * getPixel(x + 1, y - 1) + KERNEL[9] * getPixel(x + 2, y - 1) +
                      KERNEL[10] * getPixel(x - 2, y) + KERNEL[11] * getPixel(x - 1, y) + KERNEL[12] * getPixel(x, y) + KERNEL[13] * getPixel(x + 1, y) + KERNEL[14] * getPixel(x + 2, y) +
                      KERNEL[15] * getPixel(x - 2, y + 1) + KERNEL[16] * getPixel(x - 1, y + 1) + KERNEL[17] * getPixel(x, y + 1) + KERNEL[18] * getPixel(x + 1, y + 1) + KERNEL[19] * getPixel(x + 2, y + 1) +
                      KERNEL[20] * getPixel(x - 2, y + 2) + KERNEL[21] * getPixel(x - 1, y + 2) + KERNEL[22] * getPixel(x, y + 2) + KERNEL[23] * getPixel(x + 1, y + 2) + KERNEL[24] * getPixel(x + 2, y + 2)) / 159;

        return Math.round(result);
    }

    for (var x = 1; x < imgWidth - 1; x++) {
        for (var y = 1; y < imgHeight - 1; y++) {
            setPixel(x, y, getSmoothValue(x, y));
        }
    }

    return imageData;
};

var Grayscale = function (imageData) {
    var pixels = imageData.data;

    for (var i = 0; i < pixels.length; i += 4) {
        pixels[i] = pixels[i + 1] = pixels[i + 2] = (pixels[i] * 0.299)+(pixels[i + 1] * 0.587)+(pixels[i + 2] * 0.114);
    }

    return imageData;
};

var Sobel = function(imageData)
{
    var inputPixels = new Uint8ClampedArray(imageData.data);
    var outputPixels = imageData.data;

    function getPixel(x, y)
    {
        return inputPixels[4 * (x + y * imgWidth)];
    }

    function setPixel(x, y, color)
    {
        var index = 4 * (x + y * imgWidth);

        outputPixels[index] = color;
        outputPixels[index + 1] = color;
        outputPixels[index + 2] = color;
    }

    function getGradient(x, y)
    {
        const LIMIT_VALUE = 180;
        const GY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        const GX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];

        var sumGx, sumGy;
        var buf1, buf2;

        buf1 = GY[0] * getPixel(x - 1, y - 1);
        buf2 = getPixel(x + 1, y + 1);

        sumGy = buf1 + GY[1] * getPixel(x, y - 1) + GY[2] * getPixel(x + 1, y - 1) +
                GY[6] * getPixel(x - 1, y + 1) + GY[7] * getPixel(x, y + 1) + buf2;

        sumGx = buf1 + GX[2] * getPixel(x + 1, y - 1) + 
                GX[3] * getPixel(x - 1, y) + GX[5] * getPixel(x + 1, y) +
                GX[6] * getPixel(x - 1, y + 1) + buf2;

        var result = Math.abs(sumGy) + Math.abs(sumGx);

        if (result > LIMIT_VALUE) {
            return 255;
        } else {
            return 0;
        }
    }

    for (var x = 1; x < imgWidth - 1; x++) {
        for (var y = 1; y < imgHeight - 1; y++) {
            setPixel(x, y, getGradient(x, y));
        }
    }

    return imageData;
};

var Svg = function(imageData)
{
    const COLOR_OF_EDGE = 255;

    var inputPixels = imageData.data;

    var svg = "<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='" + imgWidth + "' height='" + imgHeight + "'>";
    var startX = 1, startY = 1;

    function setPixel(x, y, color)
    {
        var index = 4 * (x + y * imgWidth);

        // inputPixels[index] = color;
        // inputPixels[index + 1] = color;
        // inputPixels[index + 2] = color;

        inputPixels[index] = 0;
        inputPixels[index + 1] = 255;
        inputPixels[index + 2] = 0;
    }

    function getPixel(x, y)
    {
        return inputPixels[4 * (x + y * imgWidth)];
    }

    function changeAngle(angle, value)
    {
        angle += value;

        if (angle < 0) {
            angle = 270;
        }

        if (angle == 360) {
            angle = 0;
        }

        return angle;
    }

    function setNextAngleAndCoords(angle, x, y)
    {
        switch (angle) {
            case 0:
                if (getPixel(x + 1, y - 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, 90);
                    x++;
                    y--;
                    endOfSegment = 0;
                } else if (getPixel(x + 1, y) == COLOR_OF_EDGE) {
                    x++;
                    endOfSegment = 0;
                } else if (getPixel(x + 1, y + 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, -90);
                    x++;
                    y++;
                    endOfSegment = 0;
                } else if (getPixel(x, y - 1) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, 90);
                    endOfSegment++;
                } else if (getPixel(x, y + 1) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                } else {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                }
                break;
            case 90:
                if (getPixel(x - 1, y - 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, 90);
                    x--;
                    y--;
                    endOfSegment = 0;
                } else if (getPixel(x, y - 1) == COLOR_OF_EDGE) {
                    y--;
                    endOfSegment = 0;
                } else if (getPixel(x + 1, y - 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, -90);
                    x++;
                    y--;
                    endOfSegment = 0;
                } else if (getPixel(x - 1, y) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, 90);
                    endOfSegment++;
                } else if (getPixel(x + 1, y) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                } else {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                }
                break;
            case 180:
                if (getPixel(x - 1, y + 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, 90);
                    x--;
                    y++;
                    endOfSegment = 0;
                } else if (getPixel(x - 1, y) == COLOR_OF_EDGE) {
                    x--;
                    endOfSegment = 0;
                } else if (getPixel(x - 1, y - 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, -90);
                    x--;
                    y--;
                    endOfSegment = 0;
                } else if (getPixel(x, y + 1) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, 90);
                    endOfSegment++;
                } else if (getPixel(x, y - 1) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                } else {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                }
                break;
            case 270:
                if (getPixel(x + 1, y + 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, 90);
                    x++;
                    y++;
                    endOfSegment = 0;
                } else if (getPixel(x, y + 1) == COLOR_OF_EDGE) {
                    y++;
                    endOfSegment = 0;
                } else if (getPixel(x - 1, y + 1) == COLOR_OF_EDGE) {
                    // angle = changeAngle(angle, -90);
                    x--;
                    y++;
                    endOfSegment = 0;
                } else if (getPixel(x + 1, y) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, 90);
                    endOfSegment++;
                } else if (getPixel(x - 1, y) == COLOR_OF_EDGE) {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                } else {
                    angle = changeAngle(angle, -90);
                    endOfSegment++;
                }
                break;
            default:
                break;
        }

        return [angle, x, y];
    }

    var amountOfSegments = 1;

    while (true) {
        var exitLoop = false;
        var endOfSegment = 0; // if 3 then this point is end of segment
        var currentAngle = 0;

        for (var y = startY; y < imgHeight - 1; y++) {
            for (var x = 1; x < imgWidth - 1; x++) {
                if (inputPixels[4 * (x + y * imgWidth)] == COLOR_OF_EDGE) {
                    startX = x;
                    startY = y;
                    exitLoop = true;
                    break;
                }
            }
            if (exitLoop) {
                break;
            }
        }

        if (!exitLoop) {
            console.log('amount of segments = ' + amountOfSegments);
            break; // exit from main loop
        }

        x = startX;
        y = startY;

        svg += "<path d='M" + x + "," + y + "L";

        while (currentAngle >= 0) {
            setPixel(x, y, COLOR_OF_EDGE);

            var values = setNextAngleAndCoords(currentAngle, x, y);
            
            currentAngle = values[0];
            x = values[1];
            y = values[2];

            if (endOfSegment === 0) {
                svg += x + "," + y + " ";
            }

            if (endOfSegment == 3/* || (x == startX && y == startY)*/) {
                break;
            }
        }

        svg = svg.slice(0, -1);
        svg += "' fill='white' stroke='black'/>";
/*
        if (amountOfSegments == 3) {
            break;
        }
*/
        amountOfSegments++;
    }

    svg += "</svg>";

    console.log(svg);

    return svg;
}
