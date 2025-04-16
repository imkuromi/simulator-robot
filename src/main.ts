import { Robot } from './robot';

// เพิ่ม console.log ตั้งแต่เริ่มต้น
console.log("Script starting...");

// ทดสอบ console.log นอก DOMContentLoaded
console.log("1. Script loaded");

// ทดสอบ console.log ใน setTimeout
setTimeout(() => {
    console.log("2. Delayed log");
}, 1000);

document.addEventListener('DOMContentLoaded', () => {
    // ทดสอบ console.log ทันทีที่ DOM โหลด
    console.log("3. DOM Content Loaded");
    
    // ทดสอบการเข้าถึง canvas
    const canvas = document.getElementById('simulator') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    console.log("4. Canvas element:", canvas);
    
    if (canvas) {
        console.log("5. Canvas found");
        console.log("6. Canvas context:", ctx);

        // First, define a type for the sensor
        type Sensor = {
            distance: number;
            angle: number;
        };

        // Then modify the sensors object to use this type
        const robot = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            speed: 2,
            direction: 0,
            isMoving: false,
            radius: 25,
            sensors: {
                front: { distance: 0, angle: 0 } as Sensor,
                leftFront: { distance: 0, angle: Math.PI / 4 } as Sensor,
                rightFront: { distance: 0, angle: -Math.PI / 4 } as Sensor,
            },
            sensorRange: 100,
            obstacles: [] as Array<{x: number, y: number, radius: number}>,
            state: 'exploring',
            gridSize: 50, // ขนาดของกริด
            coveredCells: new Set<string>(), // เซตเก็บเซลล์ที่ผ่านไปแล้ว
            lastTurnTime: 0, // เวลาที่เลี้ยวครั้งล่าสุด
            turnInterval: 2000, // ระยะเวลาระหว่างการเลี้ยว (ms)
            coverage: 0 // เปอร์เซ็นต์พื้นที่ที่ผ่านไปแล้ว
        };

        // สร้างสิ่งกีดขวางสุ่ม
        function createRandomObstacles(count: number) {
            for (let i = 0; i < count; i++) {
                const obstacle = {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: 20 + Math.random() * 30
                };
                robot.obstacles.push(obstacle);
            }
        }

        // สร้างสิ่งกีดขวาง 5 ชิ้น
        createRandomObstacles(5);

        // ฟังก์ชันคำนวณตำแหน่งเซลล์
        function getCellPosition(x: number, y: number): string {
            const cellX = Math.floor(x / robot.gridSize);
            const cellY = Math.floor(y / robot.gridSize);
            return `${cellX},${cellY}`;
        }

        // ฟังก์ชันคำนวณเปอร์เซ็นต์พื้นที่ที่ผ่านไปแล้ว
        function calculateCoverage(): number {
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
            }

            // วาดเส้นแนวนอน
            for (let y = 0; y <= canvas.height; y += robot.gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
            }

            ctx.stroke();

            // วาดเซลล์ที่ผ่านไปแล้ว
            robot.coveredCells.forEach(cell => {
                const [x, y] = cell.split(',').map(Number);
                ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
                ctx.fillRect(x * robot.gridSize, y * robot.gridSize, robot.gridSize, robot.gridSize);
            });
        }

        function drawRobot(x: number, y: number, direction: number) {
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
            Object.keys(robot.sensors).forEach((key) => {
                const sensor = robot.sensors[key as keyof typeof robot.sensors];
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const sensorX = Math.cos(sensor.angle) * robot.sensorRange;
                const sensorY = Math.sin(sensor.angle) * robot.sensorRange;
                ctx.lineTo(sensorX, sensorY);
                
                // สีของลำแสงเซนเซอร์ขึ้นอยู่กับระยะทาง
                const alpha = 1 - (sensor.distance / robot.sensorRange);
                ctx.strokeStyle = `rgba(255, 82, 82, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();

                // วาดจุดเซนเซอร์
                ctx.beginPath();
                ctx.arc(
                    Math.cos(sensor.angle) * robot.radius,
                    Math.sin(sensor.angle) * robot.radius,
                    4, 0, Math.PI * 2
                );
                ctx.fillStyle = '#FF5252';
                ctx.fill();
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

        function validateRobotState() {
            // ตรวจสอบตำแหน่ง
            if (isNaN(robot.x) || isNaN(robot.y)) {
                console.warn('Invalid robot position, resetting to center');
                robot.x = canvas.width / 2;
                robot.y = canvas.height / 2;
            }

            // ตรวจสอบทิศทาง
            if (isNaN(robot.direction)) {
                console.warn('Invalid robot direction, resetting to 0');
                robot.direction = 0;
            }

            // ตรวจสอบความเร็ว
            if (robot.speed < 0 || robot.speed > 5) {
                console.warn('Invalid robot speed, resetting to default');
                robot.speed = 2;
            }

            // ตรวจสอบเซนเซอร์
            Object.entries(robot.sensors).forEach(([key, sensor]) => {
                if (isNaN(sensor.distance) || isNaN(sensor.angle)) {
                    console.warn(`Invalid sensor ${key} values, resetting`);
                    sensor.distance = robot.sensorRange;
                    sensor.angle = robot.sensors[key as keyof typeof robot.sensors].angle;
                }
            });
        }

        function checkBoundaries() {
            const margin = robot.radius + 10; // เพิ่มระยะเผื่อ 10 พิกเซล
            
            // ตรวจสอบขอบซ้าย
            if (robot.x < margin) {
                robot.x = margin;
                robot.direction = Math.PI / 2; // หันไปทางขวา
            }
            
            // ตรวจสอบขอบขวา
            if (robot.x > canvas.width - margin) {
                robot.x = canvas.width - margin;
                robot.direction = -Math.PI / 2; // หันไปทางซ้าย
            }
            
            // ตรวจสอบขอบบน
            if (robot.y < margin) {
                robot.y = margin;
                robot.direction = 0; // หันลง
            }
            
            // ตรวจสอบขอบล่าง
            if (robot.y > canvas.height - margin) {
                robot.y = canvas.height - margin;
                robot.direction = Math.PI; // หันขึ้น
            }
        }

        function moveRobot() {
            if (!robot.isMoving) return;

            // ตรวจสอบความถูกต้องของข้อมูล
            validateRobotState();
            
            checkSensors();
            
            // บันทึกเซลล์ปัจจุบัน
            const currentCell = getCellPosition(robot.x, robot.y);
            robot.coveredCells.add(currentCell);
            robot.coverage = calculateCoverage();

            if (robot.state === 'avoiding') {
                // หลบหลีกสิ่งกีดขวางและขอบ
                if (robot.sensors.leftFront.distance > robot.sensors.rightFront.distance) {
                    robot.direction += 0.1;
                } else {
                    robot.direction -= 0.1;
                }
                
                // คำนวณความเร็วที่ปลอดภัย
                const minDistance = Math.min(...Object.entries(robot.sensors).map(([_, s]) => s.distance));
                const safeSpeed = Math.min(robot.speed, minDistance / 10);
                robot.x += Math.cos(robot.direction) * safeSpeed;
                robot.y += Math.sin(robot.direction) * safeSpeed;
            } else {
                // เคลื่อนที่ปกติ
                robot.x += Math.cos(robot.direction) * robot.speed;
                robot.y += Math.sin(robot.direction) * robot.speed;

                // ตรวจสอบเวลาที่ผ่านไปตั้งแต่เลี้ยวครั้งล่าสุด
                const currentTime = Date.now();
                if (currentTime - robot.lastTurnTime > robot.turnInterval) {
                    // เลือกทิศทางใหม่
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
                    } else {
                        // ถ้าทุกทิศทางผ่านไปแล้ว ให้เลี้ยวแบบสุ่ม
                        robot.direction += (Math.random() - 0.5) * Math.PI;
                    }
                    
                    robot.lastTurnTime = currentTime;
                }
            }

            // ตรวจสอบขอบเขต
            checkBoundaries();
        }

        function update() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // วาดกริดและพื้นที่ที่ผ่านไปแล้ว
            drawGrid();
            
            // วาดสิ่งกีดขวาง
            drawObstacles();
            
            // เคลื่อนที่หุ่นยนต์
            moveRobot();
            
            // วาดหุ่นยนต์
            drawRobot(robot.x, robot.y, robot.direction);

            // แสดงเปอร์เซ็นต์พื้นที่ที่ผ่านไปแล้ว
            ctx.fillStyle = 'black';
            ctx.font = '16px Arial';
            ctx.fillText(`Coverage: ${robot.coverage.toFixed(1)}%`, 10, 30);

            requestAnimationFrame(update);
        }

        // ปุ่มควบคุม
        const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
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