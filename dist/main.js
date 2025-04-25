"use strict";
document.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('simulator');
    let ctx = canvas.getContext('2d');
    let moveUpBtn = document.getElementById('moveUp');
    let moveDownBtn = document.getElementById('moveDown');
    let moveLeftBtn = document.getElementById('moveLeft');
    let moveRightBtn = document.getElementById('moveRight');
    let rotateLeftBtn = document.getElementById('rotateLeft');
    let rotateRightBtn = document.getElementById('rotateRight');
    let createObstaclesBtn = document.getElementById('createObstacles');
    let clearObstaclesBtn = document.getElementById('clearObstacles');
    let obstacles = [];
    let robot = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        // x: 50,
        // y: 50,
        size: 50,
        speed: 5,
        sensorRange: 150,
        fov: Math.PI / 6, // 30 degrees
        direction: 0,
    };
    let moveUp = () => {
        robot.y -= robot.speed;
        update();
    };
    let moveDown = () => {
        robot.y += robot.speed;
        update();
    };
    let moveLeft = () => {
        robot.x -= robot.speed;
        update();
    };
    let moveRight = () => {
        robot.x += robot.speed;
        update();
    };
    let rotateLeft = () => {
        robot.direction -= Math.PI / 90;
        update();
    }; // 2 degrees
    let rotateRight = () => {
        robot.direction += Math.PI / 90;
        update();
    }; // 2 degrees
    let createObstacles = () => {
        let max = 5;
        let obstacle = {
            // x: Math.random() * canvas.width,
            // y: Math.random() * canvas.height,
            x: 250,
            y: 270,
            // width: Math.random() * 50 + 10, // Random width between 10 and 60
            // height: Math.random() * 50 + 10, // Random height between 10 and 60
            width: 100,
            height: 50,
        };
        if (obstacles.length < max) {
            obstacles.push(obstacle);
        }
        update();
    };
    let clearObstacles = () => {
        obstacles = [];
        update();
    };
    let drawObstacles = () => {
        for (let obstacle of obstacles) {
            ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            ctx.strokeStyle = "rgba(0, 0, 255, 1)";
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    };
    let drawRobot = () => {
        // Draw sensor FOV as a filled arc and robot body, rotating with robot direction
        ctx.save();
        ctx.translate(robot.x, robot.y);
        ctx.rotate(robot.direction);
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.arc(0, 0, robot.sensorRange + 20, -robot.fov / 2, robot.fov / 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 242, 0, 0.76)";
        ctx.fill();
        // Draw robot body
        ctx.beginPath();
        ctx.arc(0, 0, robot.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
        ctx.fill();
        // Draw eye to indicate front
        ctx.beginPath();
        ctx.arc(robot.size * 0.6, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.restore();
    };
    let update = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawObstacles();
        drawRobot();
    };
    if (!canvas || !ctx) {
        console.error("Canvas or context not found.");
        return;
    }
    update(); // Initial draw when the page loads
    moveUpBtn.addEventListener('click', moveUp);
    moveDownBtn.addEventListener('click', moveDown);
    moveLeftBtn.addEventListener('click', moveLeft);
    moveRightBtn.addEventListener('click', moveRight);
    rotateLeftBtn.addEventListener('click', rotateLeft);
    rotateRightBtn.addEventListener('click', rotateRight);
    createObstaclesBtn.addEventListener('click', createObstacles);
    clearObstaclesBtn.addEventListener('click', clearObstacles);
});
