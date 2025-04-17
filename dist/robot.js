export class Robot {
    constructor(x, y, speed) {
        // กำหนดค่าเริ่มต้นให้กับตำแหน่งและความเร็วของหุ่นยนต์
        this.x = x;
        this.y = y;
        this.speed = speed;
    }
    moveTowards(targetX, targetY) {
        // คำนวณระยะทางในแนวแกน x และ y จากตำแหน่งปัจจุบันไปยังเป้าหมาย
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        // คำนวณระยะทางรวมจากตำแหน่งปัจจุบันไปยังเป้าหมาย
        const distance = Math.sqrt(dx * dx + dy * dy);
        // ถ้าระยะทางมากกว่าความเร็วของหุ่นยนต์ ให้เคลื่อนที่ไปในทิศทางของเป้าหมาย
        if (distance > this.speed) {
            const ratio = this.speed / distance; // อัตราส่วนของความเร็วต่อระยะทาง
            this.x += dx * ratio; // ปรับตำแหน่งแกน x
            this.y += dy * ratio; // ปรับตำแหน่งแกน y
        }
    }
}
