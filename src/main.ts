import { Robot, Ultrasonic } from "./robot.js";

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("simulator") as HTMLCanvasElement;
    const mapImage = new Image();
    mapImage.src = "images/map_4.png";

    const robotImage = new Image();
    robotImage.src = "images/robot.png";
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const MAP_DIMENSIONS: [number, number] = [mapImage.width, mapImage.height];
    canvas.width = MAP_DIMENSIONS[0];
    canvas.height = MAP_DIMENSIONS[1];

    const start: [number, number] = [100, 300];
    const robot = new Robot(start, 0.01 * 3779.52);
    const sensorRange: [number, number] = [150, (Math.PI) / 4];
    const ultrasonic = new Ultrasonic(sensorRange, canvas);

    let lastTime = performance.now();

    function drawRobot(x: number, y: number, heading: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-heading);
        ctx.drawImage(robotImage, -robot.w * 2, -robot.w);
        ctx.restore();
    }

    function drawSensorData(pointCloud: [number, number][]) {
        for (const [x, y] of pointCloud) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    }

    function loop(timestamp: number) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0);
        // ctx.fillStyle = "red"
        // ctx.fillRect(robot.x, robot.y, robot.w, robot.w)
        robot.kinematics(dt);
        drawRobot(robot.x, robot.y, robot.heading);

        const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading, 20);
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