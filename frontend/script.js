// define constants
const CELL_SIZE = 10; // size of each cell in pixels
const GRID_WIDTH = 100; // number of cells horizontally
const GRID_HEIGHT = 100; // number of cells vertically
let fps = 10; // frames per second for the simulation

// get the canvas element and its drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// set the canvas dimensions based on the grid size and cell size
canvas.width = GRID_WIDTH * CELL_SIZE;
canvas.height = GRID_HEIGHT * CELL_SIZE;

// initialize the grid and running state
let grid = createGrid(GRID_HEIGHT, GRID_WIDTH);
let running = false;

// set up event listeners for UI controls
document.getElementById('startButton').addEventListener('click', toggleRunning);
document.getElementById('resetButton').addEventListener('click', resetGrid);
document.getElementById('fpsRange').addEventListener('input', (e) => fps = parseInt(e.target.value));

// event listener for canvas clicks to toggle cell state
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
    grid[y][x] = grid[y][x] === 1 ? 0 : 1; // togle cell state between 0 (dead) and 1 (alive)
    drawGrid(); // redraw the grid to reflect changes
});

// function to create a grid with all cells initialized to 0 (dead)
function createGrid(height, width) {
    return new Array(height).fill(null).map(() => new Array(width).fill(0));
}

// function to draw the grid on the canvas
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            ctx.fillStyle = grid[y][x] === 1 ? 'white' : 'black'; // cell color
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE); // draw the cell
            ctx.strokeStyle = 'white'; // stroke color
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE); // cell border
        }
    }
}

// function to update the grid based on the rules
function updateGrid() {
    const newGrid = createGrid(GRID_HEIGHT, GRID_WIDTH); // create a new grid for the next state
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const aliveNeighbors = getAliveNeighbors(y, x); // count alive neighbors
            if (grid[y][x] === 1) {
                newGrid[y][x] = aliveNeighbors < 2 || aliveNeighbors > 3 ? 0 : 1; // apply rules for alive cells
            } else {
                newGrid[y][x] = aliveNeighbors === 3 ? 1 : 0; // apply rules for dead cells
            }
        }
    }
    grid = newGrid; // update the grid to the new state
}

// function to count alive neighbors around a cell
function getAliveNeighbors(y, x) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue; // skip the cell itself
            const newY = y + i;
            const newX = x + j;
            if (newY >= 0 && newY < GRID_HEIGHT && newX >= 0 && newX < GRID_WIDTH) {
                count += grid[newY][newX]; // count alive neighbors
            }
        }
    }
    return count;
}

// function to start or stop the simulation
function toggleRunning() {
    running = !running;
    document.getElementById('startButton').textContent = running ? 'Stop' : 'Start'; // Toggle button text
    if (running) {
        runGame(); // start the game loop if running
    }
}

// function to run the game loop at the specified FPS
function runGame() {
    if (running) {
        updateGrid(); // update grid state
        drawGrid(); // draw the updated grid
        setTimeout(runGame, 1000 / fps); // schedule the next frame
    }
}

// function to reset the grid to all dead cells and redraw
function resetGrid() {
    grid = createGrid(GRID_HEIGHT, GRID_WIDTH);
    drawGrid();
}

// initial drawing of the grid
drawGrid();
