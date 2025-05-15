export class Lidar { // ประกาศคลาส Lidar สำหรับจำลองเซนเซอร์ Lidar
    range: number; // ระยะไกลสุดที่ Lidar ตรวจจับได้ (หน่วยพิกเซล)
    angleStep: number; // ขนาดมุมในการหมุนแต่ละครั้ง (หน่วยเรเดียน, ถูกแปลงจากองศาใน constructor)
    lidarAngle: number;
    canvas: HTMLCanvasElement; // อ้างอิงถึง HTML canvas element ที่ใช้แสดงผล
    ctx: CanvasRenderingContext2D; // Context 2D ของ canvas สำหรับวาดและอ่านค่าพิกเซล
    mapWidth: number; // ความกว้างของ canvas (แผนที่)
    mapHeight: number; // ความสูงของ canvas (แผนที่)

    // Constructor: ฟังก์ชันที่ถูกเรียกเมื่อสร้าง object Lidar ใหม่
    constructor(range: number, angleStep: number,lidarAngle:number,  canvas: HTMLCanvasElement) {
        this.range = range; // กำหนดระยะตรวจจับสูงสุดจาก argument ที่รับมา
        this.angleStep = angleStep * (Math.PI / 180); // แปลง angleStep จากองศาเป็นเรเดียน
        this.lidarAngle = lidarAngle * (Math.PI / 180);
        this.canvas = canvas; // เก็บ reference ของ canvas
        this.ctx = canvas.getContext("2d")!; // ดึง 2D context จาก canvas
        this.mapWidth = canvas.width; // เก็บความกว้างของ canvas
        this.mapHeight = canvas.height; // เก็บความสูงของ canvas
    }

    // ฟังก์ชัน scan: ทำการสแกนหาสิ่งกีดขวางรอบตัวหุ่นยนต์
    scan(x: number, y: number, heading: number): [number, number][] {
        const points: [number, number][] = []; // Array สำหรับเก็บตำแหน่ง [x, y] ของสิ่งกีดขวางที่พบ

        // วน loop สแกนรอบตัวหุ่นยนต์ โดยเริ่มจาก heading-lidarAngle ถึง heading+lidarAngle เหมือนกับ ultrasonic
        const start_angle = heading - this.lidarAngle;
        const finish_angle = heading + this.lidarAngle;

        for (let angle = start_angle; angle < finish_angle; angle += this.angleStep) {
            const theta = angle; // ใช้มุมโดยตรงเพราะได้รวม heading แล้ว

            // คำนวณจุดปลายของเส้นเลเซอร์ (เหมือนกับ ultrasonic)
            const endX = x + this.range * Math.cos(theta);
            const endY = y - this.range * Math.sin(theta);

            // ใช้การประมาณค่าระหว่างจุดเริ่มต้นและจุดสิ้นสุด (เหมือนกับ ultrasonic)
            let obstacleFound = false;

            // วนลูปตามความยาวของเส้น (เหมือนกับ ultrasonic)
            for (let j = 0; j < 100; j++) {
                let u = j / 100; // ค่าสัดส่วนระหว่าง 0-1
                let scanX = Math.floor(endX * u + x * (1 - u)); // ประมาณค่า x
                let scanY = Math.floor(endY * u + y * (1 - u)); // ประมาณค่า y

                // ตรวจสอบว่าพิกัดอยู่ใน canvas หรือไม่
                if (scanX >= 0 && scanY >= 0 && scanX < this.mapWidth && scanY < this.mapHeight) {
                    // อ่านค่าสีของพิกเซล ณ ตำแหน่ง (scanX, scanY)
                    const pixel = this.ctx.getImageData(scanX, scanY, 1, 1).data;

                    // วาดเส้นเลเซอร์ (เหมือนกับ ultrasonic)
                    this.ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; // สีเขียวโปร่งใสเข้มขึ้น
                    this.ctx.fillRect(scanX, scanY, 2, 1); // วาดเส้นเล็กๆ ตามเส้นทางของเลเซอร์ เหมือนกับ ultrasonic

                    // ตรวจสอบว่าพิกเซลเป็นสีดำหรือใกล้เคียงหรือไม่ (R<20, G<20, B<20), เหมือนกับ ultrasonic
                    if (pixel[0] < 20 && pixel[1] < 20 && pixel[2] < 20) {
                        points.push([scanX, scanY]); // เพิ่มตำแหน่งที่พบสิ่งกีดขวางลงใน array
                        obstacleFound = true;
                        break; // หยุดการสแกนในทิศทาง (angle) นี้ เพราะเจอสิ่งกีดขวางแล้ว
                    }
                } else {
                    // ถ้าพิกัดอยู่นอก canvas ให้หยุดสแกนในทิศทางนี้ (ป้องกัน error และเพิ่มประสิทธิภาพ)
                    break;
                }
            }
        }

        return points; // คืนค่า array ของตำแหน่งสิ่งกีดขวางที่ตรวจพบ
    }

    // ฟังก์ชัน drawScan: วาดจุดแสดงตำแหน่งที่ Lidar ตรวจพบสิ่งกีดขวาง
    drawScan(points: [number, number][]) {
        this.ctx.fillStyle = '#00FF00'; // สีเขียวสด (bright green)
        // วน loop ไปยังทุกจุดที่พบสิ่งกีดขวาง
        for (const [x, y] of points) {
            // วาดวงกลมสีเขียวที่ตำแหน่งที่พบสิ่งกีดขวาง
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2); // วาดวงกลมขนาดรัศมี 4 พิกเซล
            this.ctx.fill();
        }
    }
}
