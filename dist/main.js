import { Robot, Ultrasonic } from "./robot.js";
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("simulator");
    const mapImage = new Image();
    mapImage.src = "images/map_5.png";
    const robotImage = new Image();
    robotImage.src = "images/robot.png";
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const MAP_DIMENSIONS = [mapImage.width, mapImage.height];
    canvas.width = MAP_DIMENSIONS[0];
    canvas.height = MAP_DIMENSIONS[1];
    const start = [100, 300];
    const robot = new Robot(start, 0.01 * 3779.52);
    const sensorRange = [150, (Math.PI) / 4];
    const ultrasonic = new Ultrasonic(sensorRange, canvas);
    const cellSize = 10;
    const gridWidth = Math.floor(canvas.width / cellSize);
    const gridHeight = Math.floor(canvas.height / cellSize);
    // Map: 0 = unknown, 1 = obstacle, 2 = explored
    const mapGrid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0));
    let lastTime = performance.now();
    function drawRobot(x, y, heading) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-heading);
        ctx.drawImage(robotImage, -robot.w * 2, -robot.w);
        ctx.restore();
    }
    function drawSensorData(pointCloud) {
        for (const [x, y] of pointCloud) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    }
    function loop(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0);
        // ctx.fillStyle = "red"
        // ctx.fillRect(robot.x, robot.y, robot.w, robot.w)
        robot.kinematics(dt);
        // Draw map grid (explored and obstacles)
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = mapGrid[y][x];
                if (cell === 2) {
                    ctx.fillStyle = "rgba(173, 216, 230, 0.3)"; // light blue = explored
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
                else if (cell === 1) {
                    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // black = obstacle
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
        drawRobot(robot.x, robot.y, robot.heading);
        const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading, 20);
        // Update explored area (robot position)
        const cx = Math.floor(robot.x / cellSize);
        const cy = Math.floor(robot.y / cellSize);
        if (mapGrid[cy] && mapGrid[cy][cx] === 0) {
            mapGrid[cy][cx] = 2;
        }
        // Mark obstacles seen by sensor
        for (const [x, y] of pointCloud) {
            const ox = Math.floor(x / cellSize);
            const oy = Math.floor(y / cellSize);
            if (mapGrid[oy] && mapGrid[oy][ox] === 0) {
                mapGrid[oy][ox] = 1;
            }
        }
        robot.avoidObstacles(pointCloud, dt);
        drawSensorData(pointCloud);
        requestAnimationFrame(loop);
    }
    mapImage.onload = () => {
        robotImage.onload = () => {
            requestAnimationFrame(loop);
        };
    };
});
