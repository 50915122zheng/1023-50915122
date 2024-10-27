const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 0;
let dy = 0;
let ballOnPaddle = true;
let paddleHeight = 10;
let paddleWidth = 150;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let brickRowCount;
let brickColumnCount;
let brickWidth = 125;
let brickHeight = 50;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 30;
let score = 0;
let lives = 10;
let ballSpeed; // 球速根据难度调整
let bricks = [];

const startGameBtn = document.getElementById("startGameBtn");
const difficultySelect = document.getElementById("difficulty");

// 监听键盘输入
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
startGameBtn.addEventListener("click", startGame);

const backgroundTheme = document.getElementById('backgroundTheme');
const backgroundMusic = document.getElementById('backgroundMusic');
const musicSource = document.getElementById('musicSource');
backgroundTheme.addEventListener('change', function() {
    document.body.classList.remove('default', 'night', 'forest');
    switch (this.value) {
        case 'default':
            document.body.classList.add('default');
            musicSource.src = 'ave.mp4'; // 替換為默認音樂的路徑
            break;
        case 'night':
            document.body.classList.add('night');
            musicSource.src = 'name.mp4'; // 替換為夜空音樂的路徑
            break;
        case 'forest':
            document.body.classList.add('forest');
            musicSource.src = '500.mp4'; // 替換為森林音樂的路徑
            break;
    }
    backgroundMusic.load(); // 加載新音樂
    backgroundMusic.play(); // 播放選定的音樂
});
const levels = [
    [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1]], // Easy Level Layout
    [[1, 1, 1, 1, 1], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [1, 0, 0, 0, 1]], // Medium Level Layout
    [[1, 1, 1, 1, 1], [1, 0, 1, 0, 1], [1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1]], // Hard Level Layout
];

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    } else if (e.key === "Up" || e.key === "ArrowUp") {
        if (ballOnPaddle) {
            ballOnPaddle = false;
            dx = (Math.random() < 0.5 ? 1 : -1); // 随机选择一个水平初速度
            dy = -ballSpeed; // 垂直方向根据难度设置
        }
    }

}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function initBricks() {
    bricks = [];
    const levelIndex = difficultySelect.value === "easy" ? 0 :
        difficultySelect.value === "medium" ? 1 : 2;

    const layout = levels[levelIndex]; // 获取当前关卡的布局

    brickRowCount = layout.length;
    brickColumnCount = layout[0].length;

    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            let hits = 1;
            if (difficultySelect.value === "medium" && Math.random() > 0.5) {
                hits = 2;
            } else if (difficultySelect.value === "hard") {
                hits = Math.floor(Math.random() * 3) + 1; // 1-3次击打
            }
            bricks[c][r] = { x: 0, y: 0, status: 1, hits: hits };
        }
    }
}
let brickStrength;

// 开始游戏时根据难度调整设置
function startGame() {
    const difficulty = difficultySelect.value;
    const backgroundTheme = document.getElementById("backgroundTheme").value;

    // 根据选择的难度设置游戏参数
    if (difficulty === "easy") {
        ballSpeed = 1.5;
        brickRowCount = 2;
        brickColumnCount = 5;
        brickStrength = 1; // 砖块强度最低
    } else if (difficulty === "medium") {
        ballSpeed = 1.8;
        brickRowCount = 3;
        brickColumnCount = 5;
        brickStrength = 2; // 部分砖块需要多次击打
    } else if (difficulty === "hard") {
        ballSpeed = 2;
        brickRowCount = 4;
        brickColumnCount = 5;
        brickStrength = 3; // 大量多次击打的砖块
    }
    countdownTime = 30; // 每次开始游戏时重置倒计时
    updateTimerDisplay();

    // 开始倒计时
    timer = setInterval(() => {
        countdownTime--;
        updateTimerDisplay();
        
        if (countdownTime <= 0) {
            clearInterval(timer);
            gameOver(); // 结束游戏
        }
    }, 1000);
    // 设置背景主题
    document.body.className = backgroundTheme;
    document.getElementById("backgroundMusic").play();
    const music = document.getElementById('backgroundMusic');
    
    initBricks();
    draw();
}

let explosions = []; // 存储爆炸效果的数组

function createExplosion(x, y) {
    explosions.push({ x: x, y: y, radius: 20, alpha: 1 }); // 创建一个新的爆炸效果
}

function drawExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];

        // 绘制爆炸效果（可以根据需求调整效果）
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 0, ${explosion.alpha})`; // 黄色，带透明度
        ctx.fill();
        ctx.closePath();

        explosion.alpha -= 0.05; // 逐渐消失
        explosion.radius += 1; // 逐渐增大

        // 移除已消失的爆炸效果
        if (explosion.alpha <= 0) {
            explosions.splice(i, 1);
        }
    }
}

let timeLimit = 60; // 限制时间（秒）
let timeLeft = timeLimit; // 剩余时间
let timerInterval; // 定时器
function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay(); // 更新显示
    } else {
        // 如果时间用完，结束游戏
        clearInterval(timerInterval);
        alert("时间到！游戏结束");
        document.location.reload(); // 或者可以重启游戏
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById("timerDisplay");
    timerDisplay.innerText = "剩余时间: " + timeLeft + " 秒";
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.hits--;
                    createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2); // 创建爆炸效果
                    playSound("hitSound"); // 播放击中音效
                    if (b.hits <= 0) {
                        b.status = 0;
                        score++;
                        if (score === brickRowCount * brickColumnCount) {
                            clearInterval(timerInterval); // 清除计时器
                            console.log("所有砖块已击破，触发过关动画"); // 用于调试
                            levelCompleteAnimation(); // 显示关卡完成动画
                            return;
                        }
                    }
                }
            }
        }
    }
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay(); // 更新显示
    } else {
        // 如果时间用完，结束游戏
        clearInterval(timerInterval);
        alert("GG");
        document.location.reload(); // 或者可以重启游戏
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById("timerDisplay");
    timerDisplay.innerText = "剩余时间: " + timeLeft + " 秒";
}

// 处理鼠标点击事件
canvas.addEventListener('click', () => {
    if (!paddle.jumpCooldown) {
        jumpPaddle();
    }
});

// 处理键盘按键事件
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !paddle.jumpCooldown) { // 你可以根据需要更改按键
        jumpPaddle();
    }
});
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.closePath();
}


function drawPaddle() {
    
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        if (score==10){
            paddleWidth = 200;
        }
        ctx.closePath();
        
    
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;

                let color;
                switch (b.hits) {
                    case 3:
                        color = "#FF0000";
                        break;
                    case 2:
                        color = "#FFFF00";
                        break;
                    case 1:
                        color = "#00FF00";
                        break;
                    default:
                        color = "#0095DD";
                }

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.closePath();
                ctx.strokeStyle = "#000"; // 设置边框颜色
                ctx.lineWidth = 2; // 边框宽度
                ctx.strokeRect(brickX, brickY, brickWidth, brickHeight); // 绘制砖块边框

                ctx.font = "16px Arial";
                ctx.fillStyle = "#000";
                ctx.fillText(b.hits, brickX + brickWidth / 2 - 5, brickY + brickHeight / 2 + 5);
            }
        }
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: " + score, 8, 20);
}

function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
}
if (score === brickRowCount * brickColumnCount) {
    clearInterval(timerInterval); // 清除计时器
    levelComplete(); // 结束当前关卡
}

function draw() {

    // 在这里控制透明度，保持之前的画面淡出
    ctx.globalAlpha = 0.8; // 设置透明度，让球轨迹逐渐淡出
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // 背景色，透明的白色
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 逐步清除画布，但保留一些残影
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawExplosions(); // 绘制爆炸效果
    drawLives();
    
    collisionDetection();

    if (ballOnPaddle) {
        // 如果球在挡板上，跟随挡板移动
        x = paddleX + paddleWidth / 2;
        y = canvas.height - paddleHeight - ballRadius;
    } else {
        // 球正常运动
        x += dx;
        y += dy;
    }

    // 碰到左右墙壁时反弹
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    // 碰到顶部时反弹
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        // 球碰到下方时，判断是否在挡板上
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            // 球掉出屏幕，减少生命
            lives--;
            if (!lives) {
                alert("GAME OVER");
                document.location.reload();
            } else {
                ballOnPaddle = true;
                dx = 0;
                dy = 0;
                paddleX = (canvas.width - paddleWidth) / 2;
            }
        }
    }

    // 挡板左右移动
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 4;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 4;
    }

    requestAnimationFrame(draw);
}
function drawTimer() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("剩余時間: " + timeLeft + " 秒", canvas.width - 200, 20);
}

function nextLevel() {
    const difficulty = difficultySelect.value;

    if (difficulty === "easy") {
        difficultySelect.value = "medium"; // 切换到中等难度
    } else if (difficulty === "medium") {
        difficultySelect.value = "hard"; // 切换到困难难度
    } else if (difficulty === "hard") {
        alert("恭喜你！！"); // 提示已通关
        return; // 已完成所有难度，不再进入新关卡
    }

    // 重置分数、生命值，并初始化新关卡
    score = 0;
    lives = 10;
    timeLeft = 60; // 重置时间（如果使用计时器）
    startGame(); // 重新初始化游戏设置
}


function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0; // Reset sound to the beginning
        sound.play();
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.hits--;
                    createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2); // 创建爆炸效果
                    playSound("hitSound"); // 播放击中音效
                    if (b.hits <= 0) {
                        b.status = 0;
                        score++;
                        if (score === brickRowCount * brickColumnCount) {
                            clearInterval(timerInterval); // 清除计时器
                            levelCompleteAnimation(); // 显示关卡完成动画
                            return;
                        }
                    }
                }
            }
        }
    }
}


function gameCompleteAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let frameCount = 0;

    function drawCompleteAnimation() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 每30帧闪烁一次“游戏完成”文字
        if (frameCount % 60 < 30) {
            ctx.font = "40px Arial";
            ctx.fillStyle = "#0095DD";
            ctx.fillText("遊戲完成!", canvas.width / 4, canvas.height / 2);
        }

        frameCount++;

        if (frameCount < 180) { // 动画持续3秒
            requestAnimationFrame(drawCompleteAnimation);
        } else {
            document.location.reload(); // 动画结束后重启游戏
        }
    }

    drawCompleteAnimation();
}

function levelCompleteAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let frameCount = 0;

    function drawCompleteAnimation() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 每30帧闪烁一次“已过关，前往下一关”
        if (frameCount % 60 < 30) {
            ctx.font = "40px Arial";
            ctx.fillStyle = "#0095DD";
            ctx.fillText("已過關！", canvas.width / 6, canvas.height / 2);
        }

        frameCount++;

        if (frameCount < 180) { // 动画持续3秒
            requestAnimationFrame(drawCompleteAnimation);
        } else {
            nextLevel(); // 动画结束后切换到下一关
        }
    }

    drawCompleteAnimation();
}
let timer; // 用于存储计时器

function updateTimerDisplay() {
    document.getElementById("time").innerText = countdownTime;
    if(score==5){
        countdownTime = 30; // 每次开始游戏时重置倒计时
    }
}

function gameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "40px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.fillText("GAME OVER", canvas.width / 4, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("重新開始", canvas.width / 3, canvas.height / 2 + 40);
    startGameBtn.style.display = "block"; // 显示重新开始按钮
    alert("時間到！");
}
// 設置擋板初始寬度
let paddleExtended = false; // 記錄是否已加長

// 定位加長按鈕
const extendPaddleBtn = document.getElementById('extend-paddle-btn');

// 點擊加長按鈕後擴展擋板
extendPaddleBtn.addEventListener('click', function() {
    if (!paddleExtended) {
        paddleWidth *= 1.5; // 將擋板寬度增加 50%
        paddleExtended = true;
        
        // 更新擋板寬度（這裡假設有更新擋板寬度的函數）
        updatePaddleWidth(paddleWidth);

        // 例如 10 秒後還原擋板寬度
        setTimeout(() => {
            paddleWidth /= 1.5;
            paddleExtended = false;
            updatePaddleWidth(paddleWidth);
        }, 5000); // 持續 10 秒
    }
});

// 假設有一個更新擋板寬度的函數
function updatePaddleWidth(newWidth) {
    const paddleElement = document.getElementById('paddle');
    paddleElement.style.width = newWidth + 'px';
}


draw();