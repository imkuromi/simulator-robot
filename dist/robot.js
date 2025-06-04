let distance = (p1, p2) => {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
};
export class Robot {
    constructor(startpos, width) {
        this.m2p = 3779.52;
        this.heading = 0;
        this.avoidanceAngle = 0;
        this.isAvoiding = false;
        this.min_obs_dist = 70;
        this.TURN_SPEED = Math.PI / 4; // 45 degrees per second
        // Add these new properties for managing 360-degree turn
        this.is360Turning = false;
        this.FULL_ROTATION = 2 * Math.PI;
        this.turnProgress = 0;
        this.turnDistanceThreshold = 120;
        // Add new properties for sensor sections
        this.sensorSections = {
            0: [], // Left section
            1: [], // Center section
            2: [], // Right section
        };
        this.w = width;
        this.x = startpos[0];
        this.y = startpos[1];
        this.vl = 0.01 * this.m2p;
        this.vr = 0.01 * this.m2p;
        this.maxspeed = 0.02 * this.m2p;
        this.minspeed = 0.01 * this.m2p;
    }
    // Add new property for spin speed
    avoidObstacles(pointCloud, dt, target) {
        const leftPoints = pointCloud.slice(0, 5);
        const centerPoints = pointCloud.slice(5, 10);
        const rightPoints = pointCloud.slice(10, 15);
        const minDistances = {
            left: this.getMinDistance(leftPoints),
            center: this.getMinDistance(centerPoints),
            right: this.getMinDistance(rightPoints),
        };
        const allFree = Object.values(minDistances).every(dist => dist > this.turnDistanceThreshold);
        if (allFree) {
            this.moveForward();
        }
        // If center is blocked, check if all sections are blocked
        const allBlocked = Object.values(minDistances).every(dist => dist < this.turnDistanceThreshold);
        if (allBlocked) {
            // Start spinning in place
            if (!this.is360Turning) {
                this.is360Turning = true;
                this.turnProgress = 0;
                // this.stopRobot()
                this.moveBackward();
                this.spinInPlace();
            }
            // Continue turning until we complete 360 degrees
            if (this.turnProgress < this.FULL_ROTATION) {
                // this.turnProgress += Math.abs(this.vr - this.vl) / this.w * dt;
                this.turnProgress += Math.PI;
                return;
            }
            else {
                // Reset turning state after completing 360 degrees
                this.is360Turning = false;
                this.turnProgress = 0;
                this.stopRobot();
            }
        }
        else if (minDistances.center < this.min_obs_dist) {
            // Center is blocked but sides aren't all blocked
            if (!this.isAvoiding) {
                this.isAvoiding = true;
                this.stopRobot();
                Math.random() > 0.5 ? this.avoidanceAngle = -this.TURN_SPEED * dt : this.avoidanceAngle = this.TURN_SPEED * dt;
                // Choose the direction with more space
            }
            this.heading += this.avoidanceAngle * this.TURN_SPEED * dt;
            return;
        }
        else if (minDistances.left > minDistances.right) {
            this.avoidanceAngle = this.TURN_SPEED * dt; // turn rigth
            this.heading += this.avoidanceAngle * this.TURN_SPEED * dt;
            return;
        }
        else if (minDistances.right > minDistances.left) {
            this.avoidanceAngle = -this.TURN_SPEED * dt; // turn left
            this.heading += this.avoidanceAngle * this.TURN_SPEED * dt;
            return;
        }
        // No obstacles in center
        this.isAvoiding = false;
        this.is360Turning = false;
        if (target) {
            this.moveToward(target[0], target[1], dt);
        }
        else {
            // this.moveForward();
            this.stopRobot();
        }
    }
    // Add new method for spinning in place
    spinInPlace() {
        this.vr = this.minspeed; // Right wheel forward
        this.vl = -this.minspeed; // Left wheel backward
    }
    getMinDistance(points) {
        if (points.length === 0)
            return Infinity;
        return Math.min(...points.map(point => Math.sqrt(Math.pow(point[0] - this.x, 2) + Math.pow(point[1] - this.y, 2))));
    }
    // Make sure you have these methods in your Robot class
    stopRobot() {
        this.vl = 0;
        this.vr = 0;
    }
    moveForward() {
        this.vl = this.minspeed;
        this.vr = this.minspeed;
    }
    moveBackward() {
        this.vl = -this.minspeed;
        this.vr = -this.minspeed;
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
        const dist = distance([this.x, this.y], [targetX, targetY]);
        const turnSpeed = dist < 50 ? this.TURN_SPEED * 2 : this.TURN_SPEED;
        this.heading = this.normalizeAngle(this.heading + Math.sign(angleDiff) * turnSpeed * dt);
        // Move forward if roughly pointing at the target (an increased angle threshold)
        if (Math.abs(angleDiff) < Math.PI / 4) { // Changed from PI/4 to PI/3
            this.moveForward();
        }
        else {
            // Stop moving when turning significantly
            this.stopRobot();
        }
    }
    kinematics(dt) {
        this.x += ((this.vl + this.vr) / 2) * Math.cos(this.heading) * dt;
        this.y -= ((this.vl + this.vr) / 2) * Math.sin(this.heading) * dt;
        this.heading += (this.vr - this.vl) / this.w * dt;
        if (this.heading > 2 * Math.PI || this.heading < -2 * Math.PI) {
            this.heading = 0;
        }
        this.vr = Math.max(Math.min(this.maxspeed, this.vr), this.minspeed);
        this.vl = Math.max(Math.min(this.maxspeed, this.vl), this.minspeed);
    }
    hasReachedTarget(currentTarget) {
        return this.distanceTo(currentTarget) < this.min_obs_dist;
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
        let x1 = x;
        let y1 = y;
        for (let i = 0; i < index; i++) {
            let angle = start_angle + ((i + 0.5) * (finish_angle - start_angle)) / index;
            let x2 = x1 + this.sensor_range[0] * Math.cos(angle);
            let y2 = y1 - this.sensor_range[0] * Math.sin(angle);
            for (let j = 0; j < 100; j++) {
                let u = j / 100;
                let x = Math.floor(x2 * u + x1 * (1 - u));
                let y = Math.floor(y2 * u + y1 * (1 - u));
                if ((x > 0 && x < this.mapWidth) && (y > 0 && y < this.mapHeight)) {
                    let imageData = this.ctx.getImageData(x, y, 1, 1).data;
                    this.ctx.fillStyle = "rgb(91, 107, 208)";
                    this.ctx.fillRect(x, y, 2, 1);
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
