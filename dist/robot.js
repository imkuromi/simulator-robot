let distance = (p1, p2) => {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
};
export class Robot {
    constructor(startpos, width) {
        this.m2p = 3779.52;
        this.heading = 0;
        this.min_obs_dist = 100;
        this.count_down = 5;
        this.w = width;
        this.x = startpos[0];
        this.y = startpos[1];
        this.vl = 0.01 * this.m2p;
        this.vr = 0.01 * this.m2p;
        this.maxspeed = 0.02 * this.m2p;
        this.minspeed = 0.01 * this.m2p;
    }
    avoidObstacles(pointCloud, dt) {
        // console.log("pointCloud");
        console.log(pointCloud);
        let closestObs = null;
        let dist = Infinity;
        if (pointCloud.length > 1) {
            for (let point of pointCloud) {
                let d = distance([this.x, this.y], point);
                console.log("point: ");
                // console.log(point)
                if (dist > d) {
                    dist = d;
                    closestObs = point;
                    // console.log("distance:")
                    // console.log(dist)
                    // console.log(`closestObs: ${closestObs}`);
                }
            }
            // console.log("Closest obstacle:", closestObs, "Distance:", dist);
            if (dist < this.min_obs_dist) {
                // console.log("Moving backward");
                console.log("dt :");
                console.log(dt);
                this.count_down -= dt;
                this.moveBackward();
            }
            else {
                // console.log("Moving forward");
                this.count_down = 5;
                this.moveForward();
            }
        }
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
        // console.log(`After kinematics: x: ${this.x}, y: ${this.y}, heading: ${this.heading}`);
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
    senseObstacles(x, y, heading) {
        let obstacles = [];
        let start_angle = heading - this.sensor_range[1];
        let finish_angle = heading + this.sensor_range[1];
        // console.log(`start_angle: ${start_angle}, finish_angle: ${finish_angle}`)
        let x1 = x;
        let y1 = y;
        let index = 15;
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
                    if (imageData[0] === 0 && imageData[1] === 0 && imageData[2] === 0) {
                        // console.log(`after : ${imageData}`)
                        // console.log("Obstacle detected at:", x, y);
                        obstacles.push([x, y]);
                        break;
                    }
                }
            }
            console.log("Distance : ", distance);
        }
        // console.log("obstacles")
        // console.log(obstacles)
        return obstacles;
    }
}
