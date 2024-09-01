// define constants
const cell_size = 10;
const grid_width = 150;
const grid_height = 100;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = grid_width * cell_size;
canvas.height = grid_height * cell_size;


// variables
let fps = 10;
let zoom = 1;
let offset_x = 0;
let offset_y = 0;
let is_dragging = false;
let last_mouse_x, last_mouse_y;
let grid = new Uint8Array(grid_width * grid_height);
let running = false;
let show_grid = true;
let last_frame_time = 0;
const fps_interval = 1000 / fps;
const cell_coords = new Float32Array(grid_width * grid_height * 2);
for (let y = 0; y < grid_height; y++) {
    for (let x = 0; x < grid_width; x++) {
        const index = (y * grid_width + x) * 2;
        cell_coords[index] = x * cell_size;
        cell_coords[index + 1] = y * cell_size;
    }
}


// set up event listeners for ui controls
document.getElementById('startButton').addEventListener('click', toggle_running);
document.getElementById('resetButton').addEventListener('click', reset_grid);
document.getElementById('fpsRange').addEventListener('input', (e) => fps = parseInt(e.target.value));
document.getElementById('zoomRange').addEventListener('input', (e) => {
    zoom = parseFloat(e.target.value);
    draw_grid();
});
document.getElementById('gridToggle').addEventListener('change', (e) => {
    show_grid = e.target.checked;
    draw_grid();
});


// event listeners for canvas mouse interactions
canvas.addEventListener('mousedown', handle_mouse_down);
canvas.addEventListener('mousemove', handle_mouse_move);
canvas.addEventListener('mouseup', () => is_dragging = false);
canvas.addEventListener('wheel', handle_wheel);
//debounce wheel event
const debounced_handle_wheel = debounce(handle_wheel, 50);
canvas.addEventListener('wheel', debounced_handle_wheel);


function handle_mouse_down(event) {
    if (event.button === 0) { // left button
        is_dragging = false;
        last_mouse_x = event.clientX;
        last_mouse_y = event.clientY;
        setTimeout(() => {
            if (!is_dragging) toggle_cell(event);
        }, 200); // delay to differentiate between click and drag
    }
}


//navigation
function handle_mouse_move(event) {
    if (event.buttons === 1) { // left button is being held down
        is_dragging = true;
        const dx = event.clientX - last_mouse_x;
        const dy = event.clientY - last_mouse_y;
        offset_x -= dx / zoom;
        offset_y -= dy / zoom;
        last_mouse_x = event.clientX;
        last_mouse_y = event.clientY;
        draw_grid();
    }
}


//zoom function
function handle_wheel(event) {
    event.preventDefault();
    const zoom_factor = 0.001;
    zoom *= Math.pow(1.1, -event.deltaY * zoom_factor);
    zoom = Math.min(Math.max(zoom, 0.1), 5);
    document.getElementById('zoomRange').value = zoom;
    draw_grid();
}


function toggle_cell(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cell_size / zoom + offset_x / cell_size);
    const y = Math.floor((event.clientY - rect.top) / cell_size / zoom + offset_y / cell_size);
    if (x >= 0 && x < grid_width && y >= 0 && y < grid_height) {
        const index = y * grid_width + x;
        grid[index] = 1 - grid[index];
        draw_grid();
    }
}


//efficient grid update algroritm
function update_grid() {
    const new_grid = new Uint8Array(grid_width * grid_height);
    for (let y = 0; y < grid_height; y++) {
        for (let x = 0; x < grid_width; x++) {
            const index = y * grid_width + x;
            const alive_neighbors = count_alive_neighbors(x, y);
            new_grid[index] = grid[index] ? (alive_neighbors === 2 || alive_neighbors === 3) : (alive_neighbors === 3);
        }
    }
    grid = new_grid;
}


function count_alive_neighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + grid_width) % grid_width;
            const ny = (y + dy + grid_height) % grid_height;
            count += grid[ny * grid_width + nx];
        }
    }
    return count;
}


//grid lines
const grid_canvas = document.createElement('canvas');
grid_canvas.width = canvas.width;
grid_canvas.height = canvas.height;
const grid_ctx = grid_canvas.getContext('2d');
draw_grid_lines();
function draw_grid_lines() {
    grid_ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    grid_ctx.beginPath();
    for (let x = 0; x <= grid_width; x++) {
        grid_ctx.moveTo(x * cell_size, 0);
        grid_ctx.lineTo(x * cell_size, canvas.height);
    }
    for (let y = 0; y <= grid_height; y++) {
        grid_ctx.moveTo(0, y * cell_size);
        grid_ctx.lineTo(canvas.width, y * cell_size);
    }
    grid_ctx.stroke();
}


// function to draw the grid on the canvas
function draw_grid() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-offset_x * zoom, -offset_y * zoom);
    ctx.scale(zoom, zoom);

    ctx.fillStyle = 'white';
    for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
            const x = cell_coords[i * 2];
            const y = cell_coords[i * 2 + 1];
            ctx.fillRect(x, y, cell_size, cell_size);
        }
    }

    if (show_grid) {
        ctx.drawImage(grid_canvas, 0, 0);
    }

    ctx.restore();
}


// function to start or stop the simulation
function toggle_running() {
    running = !running;
    document.getElementById('startButton').textContent = running ? 'stop' : 'start';
    if (running) requestAnimationFrame(run_game);
}


// function to run the game loop
function run_game(current_time) {
    if (!running) return;

    if (current_time - last_frame_time >= fps_interval) {
        last_frame_time = current_time;
        update_grid();
        draw_grid();
    }

    requestAnimationFrame(run_game);
}


// function to reset the grid to all dead cells and redraw
function reset_grid() {
    grid = new Uint8Array(grid_width * grid_height);
    draw_grid();
}


// utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executed_function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// initial drawing of the grid
draw_grid();
