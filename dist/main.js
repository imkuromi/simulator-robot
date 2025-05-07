import { Robot, Ultrasonic } from "./robot.js";
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("simulator");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    //ctx คือ context แบบ 2D ใช้สำหรับวาดกราฟิก willReadFrequently: true ทำให้ canvas อ่านค่าพิกเซลได้เร็วขึ้น (เหมาะสำหรับงานที่ต้องอ่านข้อมูลภาพบ่อยๆ)
    const MAP_DIMENSIONS = [1200, 600];
    canvas.width = MAP_DIMENSIONS[0];
    canvas.height = MAP_DIMENSIONS[1];
    const mapImage = new Image();
    mapImage.src = "images/map.png";
    const robotImage = new Image();
    robotImage.src = "images/robot1.png";
    const start = [100, 300];
    const robot = new Robot(start, 0.01 * 3779.52);
    const sensorRange = [200, (30 * Math.PI) / 180];
    //ตรวจจับได้ไกล 250px และมุมตรวจจับ 40 องศา (แปลงเป็นเรเดียน)
    //(40 * Math.PI) / 180 เป็นสูตรที่ใช้ แปลงองศา (degrees) เป็นเรเดียน (radians)
    //เพราะใน JavaScript (และคณิตศาสตร์ทั่วไป) มุมในฟังก์ชันตรีโกณมิติเช่น Math.sin(), Math.cos() ฯลฯ ต้องอยู่ใน
    //เรเดียน = องศา × (π / 180)
    //(40 * Math.PI) / 180 คือการแปลงมุม 40 องศาให้กลายเป็น 0.6981 เรเดียน
    const ultrasonic = new Ultrasonic(sensorRange, canvas);
    let lastTime = performance.now();
    //บันทึกเวลาปัจจุบัน เพื่อใช้คำนวณเวลาที่ผ่านไปในแต่ละรอบการวาด
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
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    }
    function loop(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        //dt: เวลาที่ผ่านไป (วินาที) นับจาก frame ที่แล้ว ใช้ควบคุมการเคลื่อนที่
        lastTime = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // ล้างภาพเดิม
        ctx.drawImage(mapImage, 0, 0); // วาดแผนที่
        robot.kinematics(dt); // คำนวณการเคลื่อนที่ของหุ่นยนต์
        drawRobot(robot.x, robot.y, robot.heading); // วาดหุ่นยนต์ที่ตำแหน่งใหม่
        const pointCloud = ultrasonic.senseObstacles(robot.x, robot.y, robot.heading); // ตรวจจับสิ่งกีดขวาง
        robot.avoidObstacles(pointCloud, dt); // หลีกเลี่ยงสิ่งกีดขวาง
        drawSensorData(pointCloud); // วาดจุดจากข้อมูลเซนเซอร์
        requestAnimationFrame(loop); // เรียกตัวเองซ้ำ (loop)
    }
    // เริ่ม simulation เมื่อโหลดภาพเสร็จ
    mapImage.onload = () => {
        robotImage.onload = () => {
            requestAnimationFrame(loop);
        };
    };
});
