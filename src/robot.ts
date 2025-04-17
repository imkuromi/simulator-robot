export class Robot {
  x: number; // ตำแหน่งแกน x ของหุ่นยนต์
  y: number; // ตำแหน่งแกน y ของหุ่นยนต์
  speed: number; // ความเร็วของหุ่นยนต์

  constructor(x: number, y: number, speed: number) {
      // กำหนดค่าเริ่มต้นให้กับตำแหน่งและความเร็วของหุ่นยนต์
      this.x = x;
      this.y = y;
      this.speed = speed;
  }

  moveTowards(targetX: number, targetY: number) {
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

//   draw(ctx: CanvasRenderingContext2D) {
//       // วาดตัวหุ่นยนต์เป็นวงกลม
//       ctx.beginPath();
//       ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
//       ctx.fillStyle = 'blue'; // สีของหุ่นยนต์
//       ctx.fill();
//       ctx.strokeStyle = 'black'; // สีขอบของหุ่นยนต์
//       ctx.lineWidth = 2; // ความหนาของขอบ
//       ctx.stroke();

//       // วาดทิศทางที่หุ่นยนต์กำลังชี้ไป
//       const angle = Math.PI / 2; // มุมที่หุ่นยนต์ชี้ขึ้นด้านบน
//       ctx.beginPath();
//       ctx.moveTo(this.x, this.y);
//       ctx.lineTo(
//           this.x + Math.cos(angle) * 15, // คำนวณตำแหน่งปลายเส้นในแกน x
//           this.y + Math.sin(angle) * 15  // คำนวณตำแหน่งปลายเส้นในแกน y
//       );
//       ctx.strokeStyle = 'white'; // สีของเส้นทิศทาง
//       ctx.lineWidth = 2; // ความหนาของเส้นทิศทาง
//       ctx.stroke();
//   }
}