let distance = (p1, p2) => {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
};
export class Robot {
    // private readonly TURN_SPEED: number = Math.PI; // 1 rotation per second
    constructor(startpos, width) {
        this.m2p = 3779.52;
        this.heading = 0;
        this.min_obs_dist = 100;
        // count_down: number = 5;
        this.isAvoiding = false;
        this.avoidanceAngle = 0;
        this.TURN_SPEED = 45 * (Math.PI / 180); // 1 rotation per second
        this.DISTANCE_THRESHOLD = 70; // pixels
        this.w = width;
        this.x = startpos[0];
        this.y = startpos[1];
        this.vl = 0.01 * this.m2p;
        this.vr = 0.01 * this.m2p;
        this.maxspeed = 0.02 * this.m2p;
        this.minspeed = 0.01 * this.m2p;
    }
    avoidObstacles(pointCloud, dt, target) {
        let minDist = Infinity;
        for (const [px, py] of pointCloud) {
            const dist = distance([this.x, this.y], [px, py]);
            minDist = Math.min(minDist, dist);
        }
        if (minDist < this.min_obs_dist) {
            if (!this.isAvoiding) {
                this.isAvoiding = true;
                this.avoidanceAngle = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
                this.stopRobot();
            }
            // Apply avoidance behavior
            this.heading += this.avoidanceAngle * this.TURN_SPEED * dt;
            return; // Exit early when avoiding
        }
        // Only reset isAvoiding when we're actually clear of obstacles
        this.isAvoiding = false;
        if (target) {
            this.moveToward(target[0], target[1], dt);
        }
        else {
            this.moveForward();
        }
    }
    normalizeAngle(angle) {
        while (angle > Math.PI)
            angle -= 2 * Math.PI;
        while (angle < -Math.PI)
            angle += 2 * Math.PI;
        return angle;
    }
    distanceTo(target) {
        return distance([this.x, this.y], target);
    }
    moveToward(targetX, targetY, dt) {
        const targetAngle = Math.atan2(-(targetY - this.y), targetX - this.x);
        const angleDiff = this.normalizeAngle(targetAngle - this.heading);
        // Adjust heading more aggressively when close to the target
        const dist = Math.sqrt((targetX - this.x) ** 2 + (targetY - this.y) ** 2);
        const turnSpeed = dist < 50 ? this.TURN_SPEED * 2 : this.TURN_SPEED;
        this.heading = this.normalizeAngle(this.heading + Math.sign(angleDiff) * turnSpeed * dt);
        // Move forward if roughly pointing at the target (an increased angle threshold)
        if (Math.abs(angleDiff) < Math.PI / 3) { // Changed from PI/4 to PI/3
            this.moveForward();
        }
        else {
            // Stop moving when turning significantly
            this.stopRobot();
        }
    }
    // moveBackward() {
    //     this.vr = -this.minspeed;
    //     this.vl = -this.minspeed / 2;
    //     // console.log(`move_backward: vl = ${this.vl}, vr = ${this.vr}`);
    // }
    stopRobot() {
        this.vr = 0;
        this.vl = 0;
        // console.log(`move_backward: vl = ${this.vl}, vr = ${this.vr}`);
    }
    moveForward() {
        this.vr = this.minspeed;
        this.vl = this.minspeed;
        // console.log(`move_forward: vl: ${this.vl}, vr: ${this.vr}`);
    }
    kinematics(dt) {
        // console.log(`Before kinematics: x: ${this.x}, y: ${this.y}, heading: ${this.heading}`);
        this.x += ((this.vl + this.vr) / 2) * Math.cos(this.heading) * dt;
        this.y -= ((this.vl + this.vr) / 2) * Math.sin(this.heading) * dt;
        this.heading += (this.vr - this.vl) / this.w * dt;
        if (this.heading > 2 * Math.PI || this.heading < -2 * Math.PI) {
            this.heading = 0;
        }
        this.vr = Math.max(Math.min(this.maxspeed, this.vr), this.minspeed);
        this.vl = Math.max(Math.min(this.maxspeed, this.vl), this.minspeed);
        // console.log(`After kinematics: x: ${this.x}, y: ${this.heading}`);
    }
    hasReachedTarget(currentTarget) {
        return this.distanceTo(currentTarget) < this.DISTANCE_THRESHOLD;
    }
}
export class Ultrasonic {
    constructor(sensor_range, canvas) {
        this.sensor_range = sensor_range;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.mapWidth = canvas.width;
        this.mapHeight = canvas.height;
    }
    senseObstacles(x, y, heading, index) {
        let obstacles = [];
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
