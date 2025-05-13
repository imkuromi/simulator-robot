// import { Robot, Ultrasonic } from "./robot.js";
// class Node {
//     constructor(
//         public x: number,
//         public y: number,
//         public parent?: Node
//     ) {}
//     distanceTo(node: Node): number {
//         return Math.hypot(this.x - node.x, this.y - node.y);
//     }
// }
// class RRT {
//     tree: Node[] = [];
//     stepSize: number;
//     goal: Node;
//     start: Node;
//     map: number[][];
//     constructor(start: Node, goal: Node, map: number[][], stepSize = 10) {
//         this.start = start;
//         this.goal = goal;
//         this.map = map;
//         this.stepSize = stepSize;
//         this.tree.push(start);
//     }
//     randomSample(gridWidth: number, gridHeight: number): Node {
//         return new Node(
//             Math.floor(Math.random() * gridWidth),
//             Math.floor(Math.random() * gridHeight)
//         );
//     }
//     nearestNode(sample: Node): Node {
//         return this.tree.reduce((nearest, node) =>
//             sample.distanceTo(node) < sample.distanceTo(nearest) ? node : nearest
//         );
//     }
//     isFree(x: number, y: number): boolean {
//         return (
//             this.map[y] && this.map[y][x] !== 1
//         );
//     }
//     isCollisionFree(start: Node, end: Node): boolean {
//         const dx = end.x - start.x;
//         const dy = end.y - start.y;
//         const steps = Math.max(Math.abs(dx), Math.abs(dy));
//         for (let i = 0; i <= steps; i++) {
//             const x = Math.round(start.x + (dx * i) / steps);
//             const y = Math.round(start.y + (dy * i) / steps);
//             if (!this.isFree(x, y)) return false;
//         }
//         return true;
//     }
//     extend(): Node | null {
//         const sample = this.randomSample(this.map[0].length, this.map.length);
//         const nearest = this.nearestNode(sample);
//         const dirX = sample.x - nearest.x;
//         const dirY = sample.y - nearest.y;
//         const len = Math.hypot(dirX, dirY);
//         const newX = Math.round(nearest.x + (this.stepSize * dirX) / len);
//         const newY = Math.round(nearest.y + (this.stepSize * dirY) / len);
//         const newNode = new Node(newX, newY, nearest);
//         if (this.isCollisionFree(nearest, newNode)) {
//             this.tree.push(newNode);
//             return newNode;
//         }
//         return null;
//     }
//     reachedGoal(): boolean {
//         return this.tree.some(n => n.distanceTo(this.goal) <= this.stepSize);
//     }
//     getPath(): Node[] {
//         const goalNode = this.tree.find(n => n.distanceTo(this.goal) <= this.stepSize);
//         const path: Node[] = [];
//         let current = goalNode;
//         while (current) {
//             path.unshift(current);
//             current = current.parent!;
//         }
//         return path;
//     }
//     run(maxIterations = 1000): Node[] {
//         for (let i = 0; i < maxIterations; i++) {
//             this.extend();
//             if (this.reachedGoal()) break;
//         }
//         return this.getPath();
//     }
// }
// window.addEventListener("DOMContentLoaded", () => {
//     const canvas = document.getElementById("simulator") as HTMLCanvasElement;
//     const mapImage = new Image();
//     mapImage.src = "images/map_5.png";
//     const robotImage = new Image();
//     robotImage.src = "images/robot.png";
//     const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
//     const MAP_DIMENSIONS: [number, number] = [mapImage.width, mapImage.height];
//     canvas.width = MAP_DIMENSIONS[0];
//     canvas.height = MAP_DIMENSIONS[1];
//     const start: [number, number] = [100, 300];
//     const robot = new Robot(start, 0.01 * 3779.52);
//     const sensorRange: [number, number] = [150, (Math.PI) / 4];
//     const ultrasonic = new Ultrasonic(sensorRange, canvas);
//     const cellSize = 10;
//     const gridWidth = Math.floor(canvas.width / cellSize);
//     const gridHeight = Math.floor(canvas.height / cellSize);
//     // Map: 0 = unknown, 1 = obstacle, 2 = explored
//     const mapGrid: number[][] = Array.from({ length: gridHeight }, () =>
//         Array(gridWidth).fill(0)
//     );
//     let lastTime = performance.now();
//     function drawRobot(x: number, y: number, heading: number) {
//         ctx.save();
//         ctx.translate(x, y);
//         ctx.rotate(-heading);
//         ctx.drawImage(robotImage, -robot.w * 2, -robot.w);
//         ctx.restore();
//     }
//     function drawSensorData(pointCloud: [number, number][]) {
//         for (const [x, y] of pointCloud) {
//             ctx.beginPath();
//             ctx.arc(x, y, 3, 0, Math.PI * 2);
//             ctx.fillStyle = 'red';
//             ctx.fill();
//         }
//     }
//     function loop(timestamp: number) {
//         const dt = (timestamp - lastTime) / 1000;
//         lastTime = timestamp;
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(mapImage, 0, 0);
//         // ctx.fillStyle = "red"
//         // ctx.fillRect(robot.x, robot.y, robot.w, robot.w)
//         robot.kinematics(dt);
//         // Draw map grid (explored and obstacles)
//         for (let y = 0; y < gridHeight; y++) {
//             for (let x = 0; x < gridWidth; x++) {
//                 const cell = mapGrid[y][x];
//                 if (cell === 2) {
//                     ctx.fillStyle = "rgba(173, 216, 230, 0.3)"; // light blue = explored
//                     ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
//                 } else if (cell === 1) {
//                     ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // black = obstacle
//                     ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
//                 }
//             }
//         }
//         drawRobot(robot.x, robot.y, robot.heading);
//         const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading, 20);
//         // Update explored area (robot position)
//         const cx = Math.floor(robot.x / cellSize);
//         const cy = Math.floor(robot.y / cellSize);
//         if (mapGrid[cy] && mapGrid[cy][cx] === 0) {
//             mapGrid[cy][cx] = 2;
//         }
//         // Mark obstacles seen by sensor
//         for (const [x, y] of pointCloud) {
//             const ox = Math.floor(x / cellSize);
//             const oy = Math.floor(y / cellSize);
//             if (mapGrid[oy] && mapGrid[oy][ox] === 0) {
//                 mapGrid[oy][ox] = 1;
//             }
//         }
//         robot.avoidObstacles(pointCloud, dt);
//         drawSensorData(pointCloud);
//         requestAnimationFrame(loop);
//     }
//     mapImage.onload = () => {
//         robotImage.onload = () => {
//             // RRT planner logic
//             const startNode = new Node(Math.floor(robot.x / cellSize), Math.floor(robot.y / cellSize));
//             const goalNode = new Node(40, 40); // Example goal position in grid coordinates
//             const rrt = new RRT(startNode, goalNode, mapGrid);
//             const path = rrt.run(2000);
//             // Draw the RRT path
//             for (const node of path) {
//                 ctx.fillStyle = "yellow";
//                 ctx.fillRect(node.x * cellSize, node.y * cellSize, cellSize, cellSize);
//             }
//             requestAnimationFrame(loop);
//         };
//     };
// });
import { Robot, Ultrasonic } from "./robot.js";
import { Lidar } from "./lidar.js";
import { OccupancyGridMap, CELL_STATE } from "./occupancyGridMap.js";
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("simulator");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    // Canvas ใหม่สำหรับ Occupancy Grid Map
    const occupancyCanvas = document.getElementById("occupancyMapCanvas");
    const occupancyCtx = occupancyCanvas.getContext("2d");
    const mapImage = new Image();
    mapImage.src = "images/map.png";
    const robotImage = new Image();
    robotImage.src = "images/robot.png";
    // const MAP_DIMENSIONS: [number, number] = [1200, 600];
    const MAP_DIMENSIONS = [mapImage.width, mapImage.height];
    canvas.width = MAP_DIMENSIONS[0];
    canvas.height = MAP_DIMENSIONS[1];
    // ตั้งค่าขนาดให้ canvas ของ occupancy map ด้วย
    occupancyCanvas.width = MAP_DIMENSIONS[0];
    occupancyCanvas.height = MAP_DIMENSIONS[1];
    // อาจจะต้องการปรับสเกล occupancy map ให้เล็กลงก็ได้ เช่น
    // occupancyCanvas.width = MAP_DIMENSIONS[0] / 2;
    // occupancyCanvas.height = MAP_DIMENSIONS[1] / 2;
    // ถ้าปรับสเกล ต้องปรับการวาดใน OccupancyGridMap หรือสเกล context ตอนวาด
    let currentTarget = null;
    const CELL_SIZE = 5;
    // OccupancyGridMap ยังคงใช้ 'canvas' (simulator canvas) สำหรับการ ray casting อ่าน map.png
    const occupancyMap = new OccupancyGridMap(MAP_DIMENSIONS[0], MAP_DIMENSIONS[1], CELL_SIZE, canvas);
    const start = [80, 80];
    const robot = new Robot(start, 0.01 * 3779.52);
    const sensorRange = [200, (40 * Math.PI) / 180];
    //ตรวจจับได้ไกล 250px และมุมตรวจจับ 40 องศา (แปลงเป็นเรเดียน)
    //(40 * Math.PI) / 180 เป็นสูตรที่ใช้ แปลงองศา (degrees) เป็นเรเดียน (radians)
    //เพราะใน JavaScript (และคณิตศาสตร์ทั่วไป) มุมในฟังก์ชันตรีโกณมิติเช่น Math.sin(), Math.cos() ฯลฯ ต้องอยู่ใน
    //เรเดียน = องศา × (π / 180)
    //(40 * Math.PI) / 180 คือการแปลงมุม 40 องศาให้กลายเป็น 0.6981 เรเดียน
    const ultrasonic = new Ultrasonic(sensorRange, canvas);
    // ใช้ sensorRange[0] (ค่าระยะของ Ultrasonic) เป็น range ของ Lidar
    const lidar = new Lidar(sensorRange[0], 1, canvas);
    let lastTime = performance.now();
    //บันทึกเวลาปัจจุบัน เพื่อใช้คำนวณเวลาที่ผ่านไปในแต่ละรอบการวาด
    function detectFrontiers(map) {
        const frontiers = [];
        const grid = map.grid;
        const CELL_SIZE = map.cellSize;
        // Iterate over the entire grid to find `UNKNOWN` cells next to `FREE` cells
        for (let y = 1; y < grid.length - 1; y++) {
            for (let x = 1; x < grid[0].length - 1; x++) {
                if (grid[y][x] === CELL_STATE.UNKNOWN) { // Unexplored cell
                    const neighbors = [
                        grid[y + 1][x], grid[y - 1][x], // Up/Down
                        grid[y][x + 1], grid[y][x - 1], // Left/Right
                    ];
                    if (neighbors.includes(CELL_STATE.FREE)) { // Check if adjacent to free space
                        frontiers.push([x * CELL_SIZE, y * CELL_SIZE]);
                    }
                }
            }
        }
        return frontiers;
    }
    function drawRobot(x, y, heading) {
        ctx.save();
        ctx.translate(x, y); // ย้ายจุด origin ไปที่ตำแหน่งหุ่นยนต์
        ctx.rotate(-heading); // หมุน canvas ให้ตรงกับทิศหุ่นยนต์
        ctx.drawImage(robotImage, -robotImage.width / 2, -robotImage.height / 2);
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
    // function loop(timestamp: number) {
    //     const dt = (timestamp - lastTime) / 1000;
    //     //dt: เวลาที่ผ่านไป (วินาที) นับจาก frame ที่แล้ว ใช้ควบคุมการเคลื่อนที่
    //     lastTime = timestamp;
    //     // --- Canvas หลัก (Simulator) ---
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    //     ctx.drawImage(mapImage, 0, 0);
    //     robot.kinematics(dt); // คำนวณการเคลื่อนที่ของหุ่นยนต์
    //     drawRobot(robot.x, robot.y, robot.heading); // วาดหุ่นยนต์ที่ตำแหน่งใหม่
    //     const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading); // ตรวจจับสิ่งกีดขวางด้วย Ultrasonic
    //     const lidarPoints = lidar.scan(robot.x, robot.y, robot.heading); // ตรวจจับด้วย Lidar
    //     // อัปเดต Occupancy Grid Map (ยังใช้ Lidar จาก simulator canvas)
    //     occupancyMap.updateWithLidarData(
    //         robot.x,
    //         robot.y,
    //         robot.heading,
    //         lidar
    //     );
    //     const frontiers = detectFrontiers(occupancyMap);
    //     if (!currentTarget || robot.distanceTo(currentTarget) < 10) {
    //         if (frontiers.length > 0) {
    //             frontiers.sort((a, b) => robot.distanceTo(a) - robot.distanceTo(b));
    //             currentTarget = frontiers[0];
    //         } else if (frontiers.length === 0) {
    //             console.log("frontier not found")
    //         }
    //         else {
    //             console.log("✅ สำรวจแมพครบแล้ว");
    //             currentTarget = null;
    //         }
    //     }
    //     if (currentTarget) {
    //         robot.moveToward(currentTarget[0], currentTarget[1], dt);
    //     } else {
    //         robot.avoidObstacles(pointCloud, dt); // fallback
    //     }
    //     drawSensorData(pointCloud); // วาดจุดจากข้อมูลเซนเซอร์ Ultrasonic
    //     lidar.drawScan(lidarPoints); // วาดจุดจาก Lidar
    //     // --- Canvas ของ Occupancy Map (ด้านล่าง) ---
    //     occupancyCtx.clearRect(0, 0, occupancyCanvas.width, occupancyCanvas.height);
    //     // วาด Occupancy Grid Map บน context ของ occupancyCanvas
    //     occupancyMap.draw(occupancyCtx);
    //     requestAnimationFrame(loop); // เรียกตัวเองซ้ำ (loop)
    // }
    function loop(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0);
        robot.kinematics(dt);
        drawRobot(robot.x, robot.y, robot.heading);
        const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading, 20);
        const lidarPoints = lidar.scan(robot.x, robot.y, robot.heading);
        // Update map with Lidar data
        occupancyMap.updateWithLidarData(robot.x, robot.y, robot.heading, lidar);
        // Get frontiers
        const frontiers = detectFrontiers(occupancyMap);
        console.log("Detected Frontiers:", frontiers); // Debugging frontiers
        if (frontiers.length > 0) {
            frontiers.sort((a, b) => robot.distanceTo(a) - robot.distanceTo(b));
            currentTarget = frontiers[0];
        }
        else {
            console.log("No frontiers found.");
            currentTarget = null;
        }
        if (currentTarget) {
            console.log(`Moving toward target: [${currentTarget[0]}, ${currentTarget[1]}]`);
            robot.moveToward(currentTarget[0], currentTarget[1], dt);
        }
        else {
            robot.avoidObstacles(pointCloud, dt); // fallback if no target
        }
        drawSensorData(pointCloud);
        lidar.drawScan(lidarPoints);
        occupancyCtx.clearRect(0, 0, occupancyCanvas.width, occupancyCanvas.height);
        occupancyMap.draw(occupancyCtx);
        requestAnimationFrame(loop);
    }
    // เริ่ม simulation เมื่อโหลดภาพเสร็จ
    mapImage.onload = () => {
        robotImage.onload = () => {
            requestAnimationFrame(loop);
        };
    };
});
