let distance = (p1: [number, number], p2: [number, number]): number => {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
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
    min_obs_dist = 100;
    count_down = 5;

    constructor(startpos: [number, number], width: number) {
        this.w = width;
        this.x = startpos[0];
        this.y = startpos[1];
        this.vl = 0.01 * this.m2p;
        this.vr = 0.01 * this.m2p;
        this.maxspeed = 0.02 * this.m2p;
        this.minspeed = 0.01 * this.m2p;
    }

    avoidObstacles(pointCloud: [number, number][], dt: number, target?: [number, number]) {
        // let closestObs: [number, number] | null = null;
        let dist = Infinity;

        for (let point of pointCloud) {
            const d = distance([this.x, this.y], point);
            if (d < dist) {
                dist = d;
                // closestObs = point;
            }
        }

        if (dist < this.min_obs_dist) {
            // console.log("Too close to obstacle, moving backward.");
            this.count_down -= dt;
            this.moveBackward();
        } else if (target) {
            // console.log(`Avoiding obstacles while steering toward [${target[0]}, ${target[1]}]`);
            this.moveToward(target[0], target[1], dt);
            this.count_down = 5;
        }
        // } else {
        //     console.log("No target — moving forward safely.");
        //     this.count_down = 5;
        //
        // }

    }

    distanceTo(target: [number, number]): number {
        return distance([this.x, this.y], target);
    }

    moveToward(tx: number, ty: number, dt: number) {
        // Mathematical formula: 
        // θ_target = atan2(ty - y, tx - x)
        // θ_new = θ_current + clamp(θ_target - θ_current, -2dt, 2dt)
        // x_new = x + cos(θ_new) * speed * dt
        // y_new = y - sin(θ_new) * speed * dt
        //
        // About "clamp" function:
        // Clamping restricts a value to stay within a specified range.
        // In this code, clamp(value, min, max) is implemented as: Math.max(min, Math.min(max, value))
        // It ensures the robot doesn't turn too sharply by limiting the angle change to [-maxTurn, maxTurn].
        // This creates smoother, more realistic movement as the robot gradually turns toward its target.
        //
        // About "dt" (delta time):
        // dt represents the time elapsed since the last frame in seconds.
        // It's crucial for frame-rate independent movement - the robot moves at the same speed
        // regardless of how fast or slow the simulation is running.
        // In this method, dt affects:
        //   1. The maximum turning rate (maxTurn = 0.1 * dt)
        //   2. The distance traveled each frame (speed * dt)
        //
        // About "maxTurn":
        // maxTurn is the maximum angle (in radians) that the robot can rotate in a single time step.
        // It's calculated as 0.1 * dt, where dt is the delta time (time elapsed since last frame).
        // This creates a rate-limited turning behavior - the robot can turn at most 0.1 radians
        // (about 5.7 degrees) per second, scaled by the time elapsed.
        // Without this limitation, the robot would instantly snap to face the target direction,
        // which would look unrealistic. Instead, maxTurn creates a smooth, gradual turning motion
        // that simulates the physical limitations of a real robot.
        //
        // Precision and maxTurn:
        // A smaller maxTurn value results in more precise turning movements. When maxTurn is small,
        // the robot makes smaller angular adjustments in each step, allowing it to follow a more
        // precise path toward the target. This is especially important for fine-grained navigation
        // around obstacles or when approaching a target that requires precise positioning.
        // However, a smaller maxTurn also means the robot takes more time steps to complete a turn,
        // resulting in slower overall turning speed but higher precision in movement.
        //
        // Example with numbers:
        // Given: robot at (100, 150), target at (200, 100), dt = 0.1, heading = 0, speed = 10
        // 1. θ_target = atan2(100 - 150, 200 - 100) = atan2(-50, 100) ≈ -0.464 radians
        // 2. angleDiff = -0.464 - 0 = -0.464
        // 3. maxTurn = 0.1 * 0.1 = 0.01
        // 4. new heading = 0 + clamp(-0.464, -0.01, 0.01) = 0 - 0.01 = -0.01 radians
        // 5. x_new = 100 + cos(-0.01) * 10 * 0.1 = 100 + 0.999 = 100.999
        // 6. y_new = 150 - sin(-0.01) * 10 * 0.1 = 150 - (-0.01) = 150.01
        const angleToTarget = Math.atan2(ty - this.y, tx - this.x);
        const angleDiff = angleToTarget - this.heading;
        const maxTurn = 0.01 * dt;
        this.heading += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
        const speed = this.minspeed;
        this.x += Math.cos(this.heading) * speed * dt;
        this.y -= Math.sin(this.heading) * speed * dt;
    }

    moveBackward() {
        this.vr = -this.minspeed;
        this.vl = -this.minspeed / 2;
        // this.vl = this.minspeed;
        // console.log(`move_backward: vl = ${this.vl}, vr = ${this.vr}`);
    }

    moveForward() {
        this.vr = this.minspeed;
        this.vl = this.minspeed;
        // console.log(`move_forward: vl: ${this.vl}, vr: ${this.vr}`);
    }

    kinematics(dt: number) {
        // console.log(`Before kinematics: x: ${this.x}, y: ${this.y}, heading: ${this.heading}`);
        this.x += ((this.vl + this.vr) / 2) * Math.cos(this.heading) * dt;
        this.y -= ((this.vl + this.vr) / 2) * Math.sin(this.heading) * dt;
        this.heading += (this.vr - this.vl) / this.w * dt;

        if (this.heading > 2 * Math.PI || this.heading < -2 * Math.PI) {
            this.heading = 0;
        }
        this.vr = Math.max(Math.min(this.maxspeed, this.vr), this.minspeed);
        this.vl = Math.max(Math.min(this.maxspeed, this.vl), this.minspeed);
        // console.log(`After kinematics: x: ${this.x}, y: ${this.y}, heading: ${this.heading}`);
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

    senseObstacles(x: number, y: number, heading: number, index: number): [number, number][] {
        let obstacles: [number, number][] = [];
        let start_angle = heading - this.sensor_range[1];
        let finish_angle = heading + this.sensor_range[1];
        // console.log(`start_angle: ${start_angle}, finish_angle: ${finish_angle}`)
        let x1 = x;
        let y1 = y;

        for (let i = 0; i < index; i++) {
            // let angle = start_angle + (i * (finish_angle - start_angle)) / index;
            let angle = start_angle + ((i + 0.5) * (finish_angle - start_angle)) / index;
            // console.log("Angle start - stop:", angle);
            let x2 = x1 + this.sensor_range[0] * Math.cos(angle);
            let y2 = y1 - this.sensor_range[0] * Math.sin(angle);
            // console.log(`Sensor : ${i + 1}`)
            // console.log(`Angle : ${angle}`)
            // console.log(`x2 sensor : ${x2}, y2 sensor : ${y2}`);

            for (let j = 0; j < 100; j++) {
                let u = j / 100;
                let x = Math.floor(x2 * u + x1 * (1 - u));
                let y = Math.floor(y2 * u + y1 * (1 - u));
                // console.log(`(x, y) : (${x}, ${y})`);

                if ((x > 0 && x < this.mapWidth) && (y > 0 && y < this.mapHeight)) {
                    let imageData = this.ctx.getImageData(x, y, 1, 1).data;
                    this.ctx.fillStyle = "rgb(91, 107, 208)";
                    this.ctx.fillRect(x, y, 2, 1);
                    // console.log("before color :")
                    // console.log(imageData)
                    if (imageData[0] < 20 && imageData[1] < 20 && imageData[2] < 20) {
                        // console.log(`after : ${imageData}`)
                        // console.log("Obstacle detected at:", x, y);
                        obstacles.push([x, y]);
                        break;
                    }
                }
            }

        }
        // console.log("obstacles")
        // console.log(obstacles)
        return obstacles;
    }
}
