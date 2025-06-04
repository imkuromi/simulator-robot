import { Robot, Ultrasonic } from "./robot.js";
import { Lidar } from "./lidar.js";
import { OccupancyGridMap } from "./occupancyGridMap.js";
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("simulator");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    // Canvas ใหม่สำหรับ Occupancy Grid Map
    const occupancyCanvas = document.getElementById("occupancyMapCanvas");
    const occupancyCtx = occupancyCanvas.getContext("2d");
    const mapImage = new Image();
    // mapImage.src = "images/map_5.png";
    mapImage.src = "images/obstacles_map.png";
    const robotImage = new Image();
    robotImage.src = "images/robot.png";
    // const MAP_DIMENSIONS: [number, number] = [1200, 600];
    const MAP_DIMENSIONS = [mapImage.width, mapImage.height];
    canvas.width = MAP_DIMENSIONS[0];
    canvas.height = MAP_DIMENSIONS[1];
    occupancyCanvas.width = MAP_DIMENSIONS[0];
    occupancyCanvas.height = MAP_DIMENSIONS[1];
    let currentTarget = null;
    const CELL_SIZE = 10;
    // OccupancyGridMap ยังคงใช้ 'canvas' (simulator canvas) สำหรับการ ray casting อ่าน map.png
    const occupancyMap = new OccupancyGridMap(MAP_DIMENSIONS[0], MAP_DIMENSIONS[1], CELL_SIZE, canvas);
    const start = [80, 80];
    const robot = new Robot(start, robotImage.width);
    const sensorRange = [120, (45 * Math.PI) / 180];
    const ultrasonic = new Ultrasonic(sensorRange, canvas);
    const lidar = new Lidar(sensorRange[0], 1, 360, canvas);
    let lastTime = performance.now();
    //บันทึกเวลาปัจจุบัน เพื่อใช้คำนวณเวลาที่ผ่านไปในแต่ละรอบการวาด
    function drawRobot(x, y, heading) {
        ctx.save();
        ctx.translate(x, y); // ย้ายจุด origin ไปที่ตำแหน่งหุ่นยนต์
        ctx.rotate(-heading); // หมุน canvas ให้ตรงกับทิศหุ่นยนต์
        ctx.drawImage(robotImage, -robotImage.width, -robotImage.height / 2);
        // วาดรูปหุ่นยนต์ให้ตรงกลาง
        ctx.restore(); // คืนค่า canvas
    }
    function drawSensorData(pointCloud) {
        for (const [x, y] of pointCloud) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2); // วาดวงกลมเล็กๆ
            ctx.fillStyle = "red";
            ctx.fill();
        }
    }
    function loop(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0);
        const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading, 15);
        const lidarPoints = lidar.scan(robot.x, robot.y, robot.heading);
        occupancyMap.updateWithLidarData(robot.x, robot.y, robot.heading, lidar);
        // Handle target sequence
        if (currentTarget) {
            if (robot.hasReachedTarget(currentTarget)) {
                currentTarget = null;
                robot.isStuck = false;
                robot.timeOut = 5;
            }
            else if (robot.checkIsStuck(robot.hasReachedTarget(currentTarget), dt)) {
                const frontiers = occupancyMap.detectFrontiers();
                if (frontiers.length > 0) {
                    frontiers.sort((a, b) => robot.distanceTo(a) - robot.distanceTo(b));
                    currentTarget = frontiers[0];
                }
            }
            else {
                robot.avoidObstacles(pointCloud, dt, currentTarget);
            }
        }
        // Find new target if we don't have one
        if (!currentTarget) {
            const frontiers = occupancyMap.detectFrontiers();
            if (frontiers.length > 0) {
                frontiers.sort((a, b) => robot.distanceTo(a) - robot.distanceTo(b));
                currentTarget = frontiers[0];
            }
            else {
                robot.vl = 0;
                robot.vr = 0;
            }
        }
        robot.kinematics(dt);
        // Draw updates
        drawRobot(robot.x, robot.y, robot.heading);
        drawSensorData(pointCloud);
        lidar.drawScan(lidarPoints);
        occupancyCtx.clearRect(0, 0, occupancyCanvas.width, occupancyCanvas.height);
        occupancyMap.draw(occupancyCtx, currentTarget);
        requestAnimationFrame(loop);
    }
    // เริ่ม simulation เมื่อโหลดภาพเสร็จ
    mapImage.onload = () => {
        robotImage.onload = () => {
            requestAnimationFrame(loop);
        };
    };
});
