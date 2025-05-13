// ค่าคงที่สำหรับสถานะของแต่ละช่องใน Grid Map
export const CELL_STATE = {
    UNKNOWN: 0,
    FREE: 1,
    OCCUPIED: 2,
};
export class OccupancyGridMap {
    constructor(mapWidthPx, mapHeightPx, cellSize, canvasForRayCasting) {
        this.cellSize = cellSize;
        this.gridWidth = Math.ceil(mapWidthPx / cellSize);
        this.gridHeight = Math.ceil(mapHeightPx / cellSize);
        this.mapOriginX = 0; // สมมติว่าแผนที่ในโลกเริ่มที่ (0,0)
        this.mapOriginY = 0;
        this.ctxForRayCasting = canvasForRayCasting.getContext("2d", { willReadFrequently: true });
        this.grid = [];
        for (let i = 0; i < this.gridWidth; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridHeight; j++) {
                this.grid[i][j] = CELL_STATE.UNKNOWN;
            }
        }
    }
    // แปลงพิกัดโลก (world coordinates) เป็นพิกัดใน grid (grid coordinates)
    worldToGrid(worldX, worldY) {
        const gridX = Math.floor((worldX - this.mapOriginX) / this.cellSize);
        const gridY = Math.floor((worldY - this.mapOriginY) / this.cellSize);
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            return [gridX, gridY];
        }
        return null; // อยู่นอกขอบเขต grid
    }
    // ตั้งค่าสถานะของช่องใน grid
    setCellState(gridX, gridY, state) {
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            // ให้ความสำคัญกับ OCCUPIED มากที่สุด (ถ้าเคยเป็น OCCUPIED แล้ว จะไม่เปลี่ยนเป็น FREE)
            if (state === CELL_STATE.OCCUPIED) {
                this.grid[gridX][gridY] = CELL_STATE.OCCUPIED;
            }
            else if (state === CELL_STATE.FREE && this.grid[gridX][gridY] !== CELL_STATE.OCCUPIED) {
                this.grid[gridX][gridY] = CELL_STATE.FREE;
            }
            else if (state === CELL_STATE.UNKNOWN && this.grid[gridX][gridY] === CELL_STATE.UNKNOWN) {
                // สามารถตั้งเป็น UNKNOWN ได้ถ้ายังไม่เคยเป็น FREE หรือ OCCUPIED
                this.grid[gridX][gridY] = CELL_STATE.UNKNOWN;
            }
        }
    }
    // อัปเดตแผนที่จากข้อมูล Lidar scan
    // updateWithLidarData(
    //     robotWorldX: number,
    //     robotWorldY: number,
    //     robotHeading: number,
    //     lidarDevice: { range: number; angleStep: number; mapWidth: number; mapHeight: number; } // ส่วนของ Lidar ที่จำเป็น
    // ) {
    //     const lidarAngleStepRad = lidarDevice.angleStep; // Lidar class เก็บ angleStep เป็นเรเดียนแล้ว
    //     const lidarMaxRange = lidarDevice.range;
    //     for (let angleOffset = 0; angleOffset < 2 * Math.PI; angleOffset += lidarAngleStepRad) {
    //         const absoluteAngle = robotHeading + angleOffset; // มุมสัมบูรณ์ที่ Lidar ยิงออกไป
    //         // ทำ Ray Casting สำหรับแต่ละมุม
    //         for (let r = 0; r < lidarMaxRange; r += this.cellSize / 2) { // สุ่มตัวอย่างถี่ขึ้นเล็กน้อยสำหรับ free space
    //             const currentWorldX = robotWorldX + r * Math.cos(absoluteAngle);
    //             const currentWorldY = robotWorldY - r * Math.sin(absoluteAngle); // แกน Y ของ Canvas กลับด้าน
    //             const gridCellCoords = this.worldToGrid(currentWorldX, currentWorldY);
    //             if (gridCellCoords) {
    //                 // ตรวจสอบสิ่งกีดขวาง ณ จุดนี้ (เหมือนที่ Lidar ทำ)
    //                 // โดยการอ่านค่าสีจาก canvas จริง (ภาพแผนที่ map.png)
    //                 const xToCheck = Math.floor(currentWorldX);
    //                 const yToCheck = Math.floor(currentWorldY);
    //                 if (xToCheck >= 0 && yToCheck >= 0 && xToCheck < lidarDevice.mapWidth && yToCheck < lidarDevice.mapHeight) {
    //                     const pixelData = this.ctxForRayCasting.getImageData(xToCheck, yToCheck, 1, 1).data;
    //                     if (pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0) { // สีดำ = สิ่งกีดขวาง
    //                         this.setCellState(gridCellCoords[0], gridCellCoords[1], CELL_STATE.OCCUPIED);
    //                         break; // หยุด ray นี้เมื่อเจอสิ่งกีดขวาง
    //                     } else {
    //                         this.setCellState(gridCellCoords[0], gridCellCoords[1], CELL_STATE.FREE);
    //                     }
    //                 } else {
    //                     break; // Ray ออกนอกขอบเขตแผนที่ (map.png)
    //                 }
    //             } else {
    //                 break; // Ray ออกนอกขอบเขต Grid Map
    //             }
    //         }
    //     }
    // }
    updateWithLidarData(robotWorldX, robotWorldY, robotHeading, lidar) {
        const lidarMaxRange = lidar.range;
        const lidarAngleStepRad = lidar.angleStep;
        for (let angleOffset = 0; angleOffset < 2 * Math.PI; angleOffset += lidarAngleStepRad) {
            const absoluteAngle = robotHeading + angleOffset;
            for (let r = 0; r < lidarMaxRange; r += this.cellSize / 2) {
                const currentWorldX = robotWorldX + r * Math.cos(absoluteAngle);
                const currentWorldY = robotWorldY - r * Math.sin(absoluteAngle);
                const gridCellCoords = this.worldToGrid(currentWorldX, currentWorldY);
                if (gridCellCoords) {
                    const xToCheck = Math.floor(currentWorldX);
                    const yToCheck = Math.floor(currentWorldY);
                    if (xToCheck >= 0 && yToCheck >= 0 && xToCheck < lidar.mapWidth && yToCheck < lidar.mapHeight) {
                        const pixelData = this.ctxForRayCasting.getImageData(xToCheck, yToCheck, 1, 1).data;
                        if (pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0) {
                            this.setCellState(gridCellCoords[0], gridCellCoords[1], CELL_STATE.OCCUPIED);
                        }
                        else {
                            this.setCellState(gridCellCoords[0], gridCellCoords[1], CELL_STATE.FREE);
                        }
                    }
                }
            }
        }
    }
    // วาด Occupancy Grid Map ลงบน canvas
    draw(ctx) {
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                const worldX = this.mapOriginX + i * this.cellSize;
                const worldY = this.mapOriginY + j * this.cellSize;
                let color = "rgba(200, 200, 200, 0.2)"; // UNKNOWN (เทาอ่อน, โปร่งแสง)
                if (this.grid[i][j] === CELL_STATE.FREE) {
                    color = "rgba(255, 255, 255, 0.3)"; // FREE (ขาว, โปร่งแสง)
                }
                else if (this.grid[i][j] === CELL_STATE.OCCUPIED) {
                    color = "rgba(50, 50, 50, 0.6)"; // OCCUPIED (เทาเข้ม, โปร่งแสง)
                }
                ctx.fillStyle = color;
                ctx.fillRect(worldX, worldY, this.cellSize, this.cellSize);
            }
        }
    }
}
