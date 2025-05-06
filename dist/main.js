import { Robot, Ultrasonic } from "./robot.js";
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("simulator");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const MAP_DIMENSIONS = [800, 600];
    canvas.width = MAP_DIMENSIONS[0];
    canvas.height = MAP_DIMENSIONS[1];
    const mapImage = new Image();
    mapImage.src = "images/map_3.png";
    const robotImage = new Image();
    robotImage.src = "images/robot.png";
    const start = [100, 300];
    const robot = new Robot(start, 0.01 * 3779.52);
    const sensorRange = [250, (Math.PI) / 6];
    const ultrasonic = new Ultrasonic(sensorRange, canvas);
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
        drawRobot(robot.x, robot.y, robot.heading);
        const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading);
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
