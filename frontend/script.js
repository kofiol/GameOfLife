// define constants
const CELL_SIZE = 10;
const GRID_WIDTH = 150;
const GRID_HEIGHT = 100;
let fps = 10;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;

// get the canvas element and its drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GRID_WIDTH * CELL_SIZE;
canvas.height = GRID_HEIGHT * CELL_SIZE;

// initialize the grid and running state
let grid = createGrid(GRID_HEIGHT, GRID_WIDTH);
let running = false;
let showGrid = true;

// set up event listeners for ui controls
document.getElementById('startButton').addEventListener('click', toggleRunning);
document.getElementById('resetButton').addEventListener('click', resetGrid);
document.getElementById('fpsRange').addEventListener('input', (e) => fps = parseInt(e.target.value));
document.getElementById('zoomRange').addEventListener('input', (e) => {
    zoom = parseFloat(e.target.value);
    drawGrid();
});

document.getElementById('gridToggle').addEventListener('change', (e) => {
    showGrid = e.target.checked;
    drawGrid();
});

// event listener for canvas clicks to toggle cell state
canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left button
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left + offsetX) / (CELL_SIZE * zoom));
        const y = Math.floor((event.clientY - rect.top + offsetY) / (CELL_SIZE * zoom));
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
        drawGrid();
    } else if (event.button === 2) { // right button
        isDragging = true;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        offsetX += event.movementX;
        offsetY += event.movementY;
        drawGrid();
    }
});

// event listener for mouse wheel to zoom
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomFactor = 0.007; // smaller zoom step
    zoom += event.deltaY * -zoomFactor;
    zoom = Math.min(Math.max(zoom, 0.1), 5);
    document.getElementById('zoomRange').value = zoom;
    drawGrid();
});

// function to create a grid with all cells initialized to 0 (dead)
function createGrid(height, width) {
    return new Array(height).fill(null).map(() => new Array(width).fill(0));
}

// function to draw the grid on the canvas
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            ctx.fillStyle = grid[y][x] === 1 ? 'white' : 'black';
            ctx.fillRect((x * CELL_SIZE * zoom) + offsetX, (y * CELL_SIZE * zoom) + offsetY, CELL_SIZE * zoom, CELL_SIZE * zoom);
            if (showGrid) {
                ctx.strokeStyle = 'white';
                ctx.strokeRect((x * CELL_SIZE * zoom) + offsetX, (y * CELL_SIZE * zoom) + offsetY, CELL_SIZE * zoom, CELL_SIZE * zoom);
            }
        }
    }
}

// function to update the grid based on the rules
function updateGrid() {
    const newGrid = createGrid(GRID_HEIGHT, GRID_WIDTH);
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const aliveNeighbors = getAliveNeighbors(y, x);
            if (grid[y][x] === 1) {
                newGrid[y][x] = aliveNeighbors < 2 || aliveNeighbors > 3 ? 0 : 1;
            } else {
                newGrid[y][x] = aliveNeighbors === 3 ? 1 : 0;
            }
        }
    }
    grid = newGrid;
}

// function to count alive neighbors around a cell
function getAliveNeighbors(y, x) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const newY = y + i;
            const newX = x + j;
            if (newY >= 0 && newY < GRID_HEIGHT && newX >= 0 && newX < GRID_WIDTH) {
                count += grid[newY][newX];
            }
        }
    }
    return count;
}

// function to start or stop the simulation
function toggleRunning() {
    running = !running;
    document.getElementById('startButton').textContent = running ? 'Stop' : 'Start';
    if (running) {
        runGame();
    }
}

// function to run the game loop at the specified FPS
function runGame() {
    if (running) {
        updateGrid();
        drawGrid();
        setTimeout(runGame, 1000 / fps);
    }
}

// function to reset the grid to all dead cells and redraw
function resetGrid() {
    grid = createGrid(GRID_HEIGHT, GRID_WIDTH);
    drawGrid();
}

// initial drawing of the grid
drawGrid();
