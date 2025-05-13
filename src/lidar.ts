export class Lidar { // ประกาศคลาส Lidar สำหรับจำลองเซนเซอร์ Lidar
    range: number; // ระยะไกลสุดที่ Lidar ตรวจจับได้ (หน่วยพิกเซล)
    angleStep: number; // ขนาดมุมในการหมุนแต่ละครั้ง (หน่วยเรเดียน, ถูกแปลงจากองศาใน constructor)

    canvas: HTMLCanvasElement; // อ้างอิงถึง HTML canvas element ที่ใช้แสดงผล
    ctx: CanvasRenderingContext2D; // Context 2D ของ canvas สำหรับวาดและอ่านค่าพิกเซล
    mapWidth: number; // ความกว้างของ canvas (แผนที่)
    mapHeight: number; // ความสูงของ canvas (แผนที่)

    // Constructor: ฟังก์ชันที่ถูกเรียกเมื่อสร้าง object Lidar ใหม่
    constructor(range: number, angleStep: number, canvas: HTMLCanvasElement) {
        this.range = range; // กำหนดระยะตรวจจับสูงสุดจาก argument ที่รับมา
        this.angleStep = angleStep * (Math.PI / 180); // แปลง angleStep จากองศาเป็นเรเดียน
        this.canvas = canvas; // เก็บ reference ของ canvas
        this.ctx = canvas.getContext("2d")!; // ดึง 2D context จาก canvas
        this.mapWidth = canvas.width; // เก็บความกว้างของ canvas
        this.mapHeight = canvas.height; // เก็บความสูงของ canvas
    }

    // ฟังก์ชัน scan: ทำการสแกนหาสิ่งกีดขวางรอบตัวหุ่นยนต์
    scan(x: number, y: number, heading: number): [number, number][] {
        const points: [number, number][] = []; // Array สำหรับเก็บตำแหน่ง [x, y] ของสิ่งกีดขวางที่พบ

        // วน loop สแกนรอบ 360 องศา (0 ถึง 2 * PI เรเดียน) โดยเพิ่มทีละ angleStep
        for (let angle = 0; angle < 2 * Math.PI; angle += this.angleStep) {
            // for (let angle = 0; angle < Math.PI / 6; angle += this.angleStep) {
            const theta = heading + angle; // คำนวณมุมสัมบูรณ์ของการสแกน (เทียบกับแกน x) โดยรวม heading ของหุ่นยนต์

            // วน loop ตรวจสอบระยะทางจากหุ่นยนต์ (r) ไปจนถึงระยะ range สูงสุด โดยเพิ่มทีละ 2 พิกเซล (เพื่อความเร็ว)
            for (let r = 0; r < this.range; r += 2) {
                // คำนวณพิกัด (scanX, scanY) ที่จะตรวจสอบ ณ มุม theta และระยะ r
                const scanX = Math.floor(x + r * Math.cos(theta)); // ปัดเศษลงเพื่อให้ได้ index พิกเซล
                const scanY = Math.floor(y - r * Math.sin(theta)); // แกน y กลับด้านใน canvas จึงใช้เครื่องหมายลบ

                // ตรวจสอบว่าพิกัดที่คำนวณได้ยังอยู่ในขอบเขตของ canvas หรือไม่
                if (scanX >= 0 && scanY >= 0 && scanX < this.mapWidth && scanY < this.mapHeight) {
                    // อ่านค่าสีของพิกเซล ณ ตำแหน่ง (scanX, scanY)
                    const pixel = this.ctx.getImageData(scanX, scanY, 1, 1).data;

                    // ตรวจสอบว่าพิกเซลเป็นสีดำหรือไม่ (R=0, G=0, B=0), ซึ่งหมายถึงสิ่งกีดขวาง
                    if (pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0) {
                        points.push([scanX, scanY]); // เพิ่มตำแหน่งที่พบสิ่งกีดขวางลงใน array
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
        this.ctx.fillStyle = 'lime'; // กำหนดสีเติมเป็นสีเขียวมะนาว (lime)
        // วน loop ไปยังทุกจุดที่พบสิ่งกีดขวาง
        for (const [x, y] of points) {
            this.ctx.fillRect(x, y, 2, 2); // วาดสี่เหลี่ยมขนาด 2x2 พิกเซล ณ ตำแหน่ง (x, y)
        }
    }
}
