// เพิ่ม console.log ตั้งแต่เริ่มต้น
console.log("Script starting...");
// ทดสอบ console.log นอก DOMContentLoaded
console.log("1. Script loaded");
// ทดสอบ console.log ใน setTimeout
setTimeout(() => {
    console.log("2. Delayed log");
}, 1000);
document.addEventListener('DOMContentLoaded', () => {
    var _a, _b;
    // ทดสอบ console.log ทันทีที่ DOM โหลด
    console.log("3. DOM Content Loaded");
    // ทดสอบการเข้าถึง canvas
    const canvas = document.getElementById('simulator');
    const ctx = canvas.getContext('2d');
    console.log("4. Canvas element:", canvas);
    if (canvas) {
        console.log("5. Canvas found");
        console.log("6. Canvas context:", ctx);
        // Then modify the sensors object to use this type
        const robot = {
            x: parseInt(((_a = document.getElementById('startX')) === null || _a === void 0 ? void 0 : _a.value) || '300'),
            y: parseInt(((_b = document.getElementById('startY')) === null || _b === void 0 ? void 0 : _b.value) || '300'),
            speed: 2,
            direction: 0,
            isMoving: false,
            radius: 25,
            sensors: {
                front: { distance: 0, angle: 0, range: 80 },
                leftFront: { distance: 0, angle: Math.PI / 3, range: 100 },
                rightFront: { distance: 0, angle: -Math.PI / 3, range: 100 },
            },
            sensorRange: 150,
            obstacles: [],
            state: 'exploring',
            gridSize: 50,
            coveredCells: new Set(),
            lastTurnTime: 0,
            turnInterval: 2000,
            coverage: 0
        };
        // สร้างสิ่งกีดขวางสุ่ม
        function createRandomObstacles(count) {
            for (let i = 0; i < count; i++) {
                let isOverlapping = true;
                let obstacle;
                // พยายามสร้างสิ่งกีดขวางจนกว่าจะไม่ทับกับสิ่งกีดขวางอื่น
                while (isOverlapping) {
                    obstacle = {
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        radius: 20 + Math.random() * 30
                    };
                    // ตรวจสอบการทับซ้อนกับสิ่งกีดขวางที่มีอยู่แล้ว
                    isOverlapping = robot.obstacles.some(existingObstacle => {
                        const dx = obstacle.x - existingObstacle.x;
                        const dy = obstacle.y - existingObstacle.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        return distance < (obstacle.radius + existingObstacle.radius);
                    });
                }
                robot.obstacles.push(obstacle);
            }
        }
        // สร้างสิ่งกีดขวาง 5 ชิ้น
        createRandomObstacles(5);
        // ฟังก์ชันคำนวณตำแหน่งเซลล์
        function getCellPosition(x, y) {
            const cellX = Math.floor(x / robot.gridSize);
            const cellY = Math.floor(y / robot.gridSize);
            return `${cellX},${cellY}`;
        }
        // ฟังก์ชันคำนวณเปอร์เซ็นต์พื้นที่ที่ผ่านไปแล้ว
        function calculateCoverage() {
            const totalCells = Math.floor(canvas.width / robot.gridSize) * Math.floor(canvas.height / robot.gridSize);
            return (robot.coveredCells.size / totalCells) * 100;
        }
        function drawGrid() {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
            ctx.lineWidth = 1;
            // วาดเส้นแนวตั้ง
            for (let x = 0; x <= canvas.width; x += robot.gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                // แสดงตัวเลขแกน X
                ctx.fillStyle = 'black';
                ctx.font = '10px Arial';
                ctx.fillText(x.toString(), x + 5, 15);
            }
            // วาดเส้นแนวนอน
            for (let y = 0; y <= canvas.height; y += robot.gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                // แสดงตัวเลขแกน Y
                ctx.fillStyle = 'black';
                ctx.font = '10px Arial';
                ctx.fillText(y.toString(), 5, y - 5);
            }
            ctx.stroke();
            // วาดเซลล์ที่ผ่านไปแล้ว
            robot.coveredCells.forEach(cell => {
                const [x, y] = cell.split(',').map(Number);
                ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
                ctx.fillRect(x * robot.gridSize, y * robot.gridSize, robot.gridSize, robot.gridSize);
            });
            // แสดงขนาดของกริด
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(`Grid Size: ${robot.gridSize}px`, canvas.width - 100, 15);
            ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}px`, canvas.width - 150, 30);
        }
        function drawRobot(x, y, direction) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(direction);
            // วาดตัวหุ่นยนต์
            ctx.beginPath();
            ctx.arc(0, 0, robot.radius, 0, Math.PI * 2);
            ctx.fillStyle = robot.state === 'avoiding' ? '#FF5252' : '#4CAF50';
            ctx.fill();
            ctx.strokeStyle = '#388E3C';
            ctx.lineWidth = 3;
            ctx.stroke();
            // วาดเซนเซอร์และลำแสง
            Object.entries(robot.sensors).forEach(([key, sensor]) => {
                // วาดจุดเซนเซอร์
                ctx.beginPath();
                ctx.arc(Math.cos(sensor.angle) * robot.radius, Math.sin(sensor.angle) * robot.radius, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#FF5252';
                ctx.fill();
                // วาดลำแสงเซนเซอร์
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const sensorX = Math.cos(sensor.angle) * sensor.range;
                const sensorY = Math.sin(sensor.angle) * sensor.range;
                ctx.lineTo(sensorX, sensorY);
                // สีของลำแสงขึ้นอยู่กับระยะทางที่ตรวจจับได้
                const alpha = 0.5; // ตั้งค่า alpha เป็นค่าคงที่ 0.5 เพื่อให้เห็นชัดเจน
                ctx.strokeStyle = `rgba(255, 82, 82, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                // แสดงระยะทางที่ตรวจจับได้
                ctx.fillStyle = 'black';
                ctx.font = '10px Arial';
                ctx.fillText(`${sensor.distance.toFixed(0)}`, sensorX + 5, sensorY + 5);
            });
            // วาดตา
            ctx.beginPath();
            ctx.arc(-8, -5, 5, 0, Math.PI * 2);
            ctx.arc(8, -5, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            // รูม่านตา
            ctx.beginPath();
            ctx.arc(-8, -5, 2, 0, Math.PI * 2);
            ctx.arc(8, -5, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.restore();
        }
        function drawObstacles() {
            robot.obstacles.forEach(obstacle => {
                ctx.beginPath();
                ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(158, 158, 158, 0.5)';
                ctx.fill();
                ctx.strokeStyle = '#757575';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }
        function checkSensors() {
            // ตรวจสอบระยะห่างจากสิ่งกีดขวางสำหรับแต่ละเซนเซอร์
            Object.entries(robot.sensors).forEach(([_, sensor]) => {
                sensor.distance = robot.sensorRange;
                // ตรวจสอบระยะห่างจากขอบ canvas
                const absoluteAngle = robot.direction + sensor.angle;
                const sensorX = robot.x + Math.cos(absoluteAngle) * robot.sensorRange;
                const sensorY = robot.y + Math.sin(absoluteAngle) * robot.sensorRange;
                // ตรวจสอบขอบซ้าย
                if (sensorX < robot.radius) {
                    const distance = Math.abs(robot.x - robot.radius);
                    if (distance < sensor.distance) {
                        sensor.distance = distance;
                    }
                }
                // ตรวจสอบขอบขวา
                if (sensorX > canvas.width - robot.radius) {
                    const distance = Math.abs(canvas.width - robot.radius - robot.x);
                    if (distance < sensor.distance) {
                        sensor.distance = distance;
                    }
                }
                // ตรวจสอบขอบบน
                if (sensorY < robot.radius) {
                    const distance = Math.abs(robot.y - robot.radius);
                    if (distance < sensor.distance) {
                        sensor.distance = distance;
                    }
                }
                // ตรวจสอบขอบล่าง
                if (sensorY > canvas.height - robot.radius) {
                    const distance = Math.abs(canvas.height - robot.radius - robot.y);
                    if (distance < sensor.distance) {
                        sensor.distance = distance;
                    }
                }
                // ตรวจสอบระยะห่างจากสิ่งกีดขวาง
                robot.obstacles.forEach(obstacle => {
                    const dx = obstacle.x - robot.x;
                    const dy = obstacle.y - robot.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) - obstacle.radius - robot.radius;
                    if (distance < sensor.distance) {
                        const angleToObstacle = Math.atan2(dy, dx);
                        const angleDiff = Math.abs(angleToObstacle - (robot.direction + sensor.angle));
                        if (angleDiff < Math.PI / 4) {
                            sensor.distance = distance;
                        }
                    }
                });
            });
            // ตรวจสอบการชนและเปลี่ยนสถานะ
            const minDistance = Math.min(...Object.entries(robot.sensors).map(([_, s]) => s.distance));
            robot.state = minDistance < robot.radius * 2 ? 'avoiding' : 'exploring';
        }
        function moveRobot() {
            if (!robot.isMoving)
                return;
            checkSensors();
            // บันทึกเซลล์ปัจจุบัน
            const currentCell = getCellPosition(robot.x, robot.y);
            robot.coveredCells.add(currentCell);
            robot.coverage = calculateCoverage();
            if (robot.state === 'avoiding') {
                // หลบหลีกสิ่งกีดขวางและขอบ
                if (robot.sensors.leftFront.distance > robot.sensors.rightFront.distance) {
                    robot.direction += 0.1;
                }
                else {
                    robot.direction -= 0.1;
                }
                const currentSpeed = robot.speed * (Math.min(...Object.entries(robot.sensors).map(([_, s]) => s.distance)) / robot.sensorRange);
                robot.x += Math.cos(robot.direction) * currentSpeed;
                robot.y += Math.sin(robot.direction) * currentSpeed;
            }
            else {
                // เคลื่อนที่ปกติ
                robot.x += Math.cos(robot.direction) * robot.speed;
                robot.y += Math.sin(robot.direction) * robot.speed;
                // ตรวจสอบเวลาที่ผ่านไปตั้งแต่เลี้ยวครั้งล่าสุด
                const currentTime = Date.now();
                if (currentTime - robot.lastTurnTime > robot.turnInterval) {
                    // เลี้ยวแบบสุ่มแต่มีแนวโน้มไปทางพื้นที่ที่ยังไม่ได้ผ่าน
                    const currentCellX = Math.floor(robot.x / robot.gridSize);
                    const currentCellY = Math.floor(robot.y / robot.gridSize);
                    // ตรวจสอบพื้นที่รอบๆ
                    const nearbyCells = [
                        getCellPosition(robot.x + robot.gridSize, robot.y),
                        getCellPosition(robot.x - robot.gridSize, robot.y),
                        getCellPosition(robot.x, robot.y + robot.gridSize),
                        getCellPosition(robot.x, robot.y - robot.gridSize)
                    ];
                    // เลือกทิศทางที่มีพื้นที่ที่ยังไม่ได้ผ่านมากที่สุด
                    const unexploredDirections = nearbyCells.map(cell => ({
                        cell,
                        explored: robot.coveredCells.has(cell)
                    }));
                    const unexploredCount = unexploredDirections.filter(d => !d.explored).length;
                    if (unexploredCount > 0) {
                        // เลือกทิศทางที่ยังไม่ได้สำรวจ
                        const unexplored = unexploredDirections.filter(d => !d.explored);
                        const randomDirection = unexplored[Math.floor(Math.random() * unexplored.length)];
                        const [targetX, targetY] = randomDirection.cell.split(',').map(Number);
                        robot.direction = Math.atan2(targetY - currentCellY, targetX - currentCellX);
                    }
                    else {
                        // ถ้าทุกทิศทางผ่านไปแล้ว ให้เลี้ยวแบบสุ่ม
                        robot.direction += (Math.random() - 0.5) * Math.PI;
                    }
                    robot.lastTurnTime = currentTime;
                }
            }
            // ป้องกันการออกนอกขอบ canvas
            robot.x = Math.max(robot.radius, Math.min(canvas.width - robot.radius, robot.x));
            robot.y = Math.max(robot.radius, Math.min(canvas.height - robot.radius, robot.y));
        }
        function update() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // วาดกริด
            drawGrid();
            // วาดสิ่งกีดขวาง
            drawObstacles();
            // เคลื่อนที่หุ่นยนต์
            moveRobot();
            // วาดหุ่นยนต์
            drawRobot(robot.x, robot.y, robot.direction);
            // แสดงข้อมูล
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(`Coverage: ${robot.coverage.toFixed(1)}%`, 10, 20);
            requestAnimationFrame(update);
        }
        // ปุ่มควบคุม
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.textContent = 'Start/Stop';
            startBtn.addEventListener('click', () => {
                robot.isMoving = !robot.isMoving;
            });
        }
        // เริ่ม animation
        console.log("Starting animation...");
        update();
    }
});
// ทดสอบ console.log ใน window.onload
window.onload = () => {
    console.log("7. Window loaded");
};
export {};
