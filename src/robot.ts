let distance = (p1: [number, number], p2: [number, number]): number => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

export class Robot {
    m2p = 3779.52;
    w: number;
    x: number;
    y: number;
    heading = 0;
    vl: number;
    vr: number;
    maxspeed: number;
    minspeed: number;
    min_obs_dist = 60;
    count_down = 5;

    constructor(startpos: [number, number], width: number) {
        this.w = width;
        this.x = startpos[0];
        this.y = startpos[1];
        this.vl = 0.01 * this.m2p;
        this.vr = 0.01 * this.m2p;
        this.maxspeed = 0.01 * this.m2p;
        this.minspeed = 0.01 * this.m2p;
    }

    avoidObstacles(pointCloud: [number, number][], dt: number) {
        let closestObs: [number, number] | null = null;
        let dist = Infinity;

        if (pointCloud.length >= 1) {
            for (const point of pointCloud) {
                const d = distance([this.x, this.y], point);
                if (d < dist) {
                    dist = d;
                    closestObs = point;
                }
            }
            if (closestObs && dist < this.min_obs_dist && this.count_down > 0) { 
                this.count_down -= dt;
                this.moveBackward();
            } else {
                this.count_down = 5;
                this.moveForward();
            }
        }
    }

    moveForward() {
        this.vr = (this.minspeed);
        this.vl = (this.minspeed);
    }

    moveBackward() {
        this.vr = (-this.minspeed);
        this.vl = (-(this.minspeed) / 2);
    }

    kinematics(dt: number) {
        this.x += (((this.vl + this.vr) / 2) * Math.cos(this.heading) * dt);
        this.y -= (((this.vl + this.vr) / 2) * Math.sin(this.heading) * dt);
        this.heading += (((this.vr - this.vl) / this.w) * dt);

        if ((Math.abs(this.heading) > (2 * Math.PI))) this.heading = 0;

        this.vr = Math.max(Math.min(this.maxspeed, this.vr), this.minspeed);
        this.vl = Math.max(Math.min(this.maxspeed, this.vl), this.minspeed);
    }
}

export class Ultrasonic {
    sensor_range: [number, number];
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    mapWidth: number;
    mapHeight: number;

    constructor(sensor_range: [number, number], canvas: HTMLCanvasElement) {
        this.sensor_range = sensor_range;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.mapWidth = canvas.width;
        this.mapHeight = canvas.height;
    }
    

    senseObstacles(x1: number, y1: number, heading: number): [number, number][] {
        const obstacles: [number, number][] = [];
        const start_angle = (heading - this.sensor_range[1]);
        const finish_angle = (heading + this.sensor_range[1]);

        for (let i = 0; i < 100; i++) {
            const angle = (start_angle + (i * (finish_angle - start_angle)) / 100);
            const x2 = (x1 + this.sensor_range[0] * Math.cos(angle));
            const y2 = (y1 - this.sensor_range[0] * Math.sin(angle));

            for (let j = 0; j < 100; j++) {
                const u = (j / 100);
                const x = Math.floor((x2 * u + x1 * (1 - u)));
                const y = Math.floor((y2 * u + y1 * (1 - u)));

                if (x > 0 && y > 0 && x < this.mapWidth && y < this.mapHeight) {
                    const imageData = this.ctx.getImageData(x, y, 1, 1).data;
                    this.ctx.fillStyle = "rgba(0,255,255,0.4)";
                    this.ctx.fillRect(x, y, 1, 1);

                    if (imageData[0] === 0 && imageData[1] === 0 && imageData[2] === 0) {
                        obstacles.push([x, y]);
                        break;
                    }
                }
            }
        }
        return obstacles;
    }
}