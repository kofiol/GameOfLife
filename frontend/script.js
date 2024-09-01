// constants
const cell_size = 10; // size of each cell in pixels
const grid_width = 200; // number of cells in width
const grid_height = 150; // number of cells in height
const canvas = document.getElementById('gameCanvas'); // canvas element for drawing the grid
const ctx = canvas.getContext('2d', { alpha: false }); // 2d context for drawing on the canvas
canvas.width = grid_width * cell_size; // set canvas width based on grid width and cell size
canvas.height = grid_height * cell_size; // set canvas height based on grid height and cell size

// variables
let fps = 10; // frames per second
let zoom = 1; // zoom level
let offset_x = 0; // x offset for panning
let offset_y = 0; // y offset for panning
let is_dragging = false; // flag for dragging state
let last_mouse_x, last_mouse_y; // last mouse position for dragging
let grid = new Uint8Array(grid_width * grid_height); // grid to store cell states (0 for dead, 1 for alive)
let running = false; // flag to control if the simulation is running
let show_grid = true; // flag to toggle grid visibility
let last_frame_time = 0; // timestamp of the last frame for fps calculation
const fps_interval = 1000 / fps; // time interval between frames based on fps
const cell_coords = new Float32Array(grid_width * grid_height * 2); // array to store cell coordinates
// populate cell_coords with x and y positions for each cell
for (let y = 0; y < grid_height; y++) {
    for (let x = 0; x < grid_width; x++) {
        const index = (y * grid_width + x) * 2;
        cell_coords[index] = x * cell_size;
        cell_coords[index + 1] = y * cell_size;
    }
}

// set up event listeners for ui controls
document.getElementById('startButton').addEventListener('click', toggle_running); // start/stop button
document.getElementById('resetButton').addEventListener('click', reset_grid); // reset button
document.getElementById('fpsRange').addEventListener('input', (e) => fps = parseInt(e.target.value)); // fps slider
document.getElementById('zoomRange').addEventListener('input', (e) => {
    zoom = parseFloat(e.target.value); // zoom slider
    draw_grid(); // redraw grid with new zoom level
});
document.getElementById('gridToggle').addEventListener('change', (e) => {
    show_grid = e.target.checked; // grid toggle checkbox
    draw_grid(); // redraw grid based on visibility
});

// file selection and drag-and-drop setup
const file_input = document.getElementById('fileInput'); // file input element
const drop_area = document.getElementById('dropArea'); // drop area for drag-and-drop

// click to select file
document.getElementById('fileSelectButton').addEventListener('click', () => file_input.click()); // button to trigger file input click

file_input.addEventListener('change', handle_file); // handle file selection

// drag-and-drop events
drop_area.addEventListener('dragover', (e) => {
    e.preventDefault(); // prevent default behavior
    drop_area.classList.add('hover'); // add hover effect
});

drop_area.addEventListener('dragleave', () => drop_area.classList.remove('hover')); // remove hover effect

drop_area.addEventListener('drop', (e) => {
    e.preventDefault(); // prevent default behavior
    drop_area.classList.remove('hover'); // remove hover effect
    const file = e.dataTransfer.files[0]; // get the dropped file
    if (file) handle_file({ target: { files: [file] } }); // process the file
});

// function to handle file selection and loading
function handle_file(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result.trim(); // get file content
            load_structure(content); // load structure from file content
        };
        reader.readAsText(file); // read file as text
    }
}

// function to load structure from file content
function load_structure(content) {
    const lines = content.split('\n'); // split content into lines
    reset_grid(); // reset the grid
    for (let y = 0; y < lines.length; y++) {
        const line = lines[y].trim(); // trim each line
        parse_structure(line, y); // parse and set the structure in grid
    }
    draw_grid(); // redraw the grid with loaded structure
}

// function to parse a line of the structure
function parse_structure(line, y) {
    let x = 0; // x position in the grid
    const parts = line.split(/(\d*\*\d+|\d+)/g).filter(part => part); // split line into parts
    for (const part of parts) {
        if (part.includes('*')) {
            const [value, count] = part.split('*').map(Number); // parse optimized notation
            for (let i = 0; i < count; i++) {
                grid[y * grid_width + x] = value; // set cell value
                x++;
            }
        } else {
            grid[y * grid_width + x] = Number(part); // set cell value
            x++;
        }
    }
}

// event listeners for canvas mouse interactions
canvas.addEventListener('mousedown', handle_mouse_down); // mouse down event
canvas.addEventListener('mousemove', handle_mouse_move); // mouse move event
canvas.addEventListener('mouseup', () => is_dragging = false); // mouse up event

// wheel event
canvas.addEventListener('wheel', handle_wheel); // handle zoom with mouse wheel

// function to handle mouse down events
function handle_mouse_down(event) {
    if (event.button === 0) { // left button
        is_dragging = false; // reset dragging state
        last_mouse_x = event.clientX; // store mouse x position
        last_mouse_y = event.clientY; // store mouse y position
        setTimeout(() => {
            if (!is_dragging) toggle_cell(event); // toggle cell if not dragging
        }, 200); // delay to differentiate between click and drag
    }
}

// function to handle mouse move events
function handle_mouse_move(event) {
    if (event.buttons === 1) { // left button is being held down
        is_dragging = true; // set dragging state
        const dx = event.clientX - last_mouse_x; // calculate x movement
        const dy = event.clientY - last_mouse_y; // calculate y movement
        offset_x -= dx / zoom; // update x offset
        offset_y -= dy / zoom; // update y offset
        last_mouse_x = event.clientX; // update last mouse x position
        last_mouse_y = event.clientY; // update last mouse y position
        draw_grid(); // redraw grid after panning
    }
}

// function to handle zoom with mouse wheel
function handle_wheel(event) {
    event.preventDefault(); // prevent default behavior
    const zoom_factor = 0.01; // zoom factor
    zoom *= Math.pow(1.1, -event.deltaY * zoom_factor); // update zoom level
    zoom = Math.min(Math.max(zoom, 0.1), 5); // clamp zoom level between 0.1 and 5
    document.getElementById('zoomRange').value = zoom; // update zoom slider
    draw_grid(); // redraw grid with new zoom level
}

// function to toggle cell state
function toggle_cell(event) {
    const rect = canvas.getBoundingClientRect(); // get canvas bounding rectangle
    const x = Math.floor((event.clientX - rect.left) / cell_size / zoom + offset_x / cell_size); // calculate x cell index
    const y = Math.floor((event.clientY - rect.top) / cell_size / zoom + offset_y / cell_size); // calculate y cell index
    if (x >= 0 && x < grid_width && y >= 0 && y < grid_height) {
        const index = y * grid_width + x; // calculate grid index
        grid[index] = 1 - grid[index]; // toggle cell state
        draw_grid(); // redraw grid
    }
}

// function to update grid based on game rules
function update_grid() {
    const new_grid = new Uint8Array(grid_width * grid_height); // create new grid
    for (let y = 0; y < grid_height; y++) {
        for (let x = 0; x < grid_width; x++) {
            const index = y * grid_width + x; // calculate grid index
            const alive_neighbors = count_alive_neighbors(x, y); // count alive neighbors
            new_grid[index] = grid[index] ? (alive_neighbors === 2 || alive_neighbors === 3) : (alive_neighbors === 3); // update cell state
        }
    }
    grid = new_grid; // replace old grid with new grid
}

// function to count alive neighbors for a cell
function count_alive_neighbors(x, y) {
    let count = 0; // initialize neighbor count
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue; // skip the cell itself
            const nx = (x + dx + grid_width) % grid_width; // calculate neighbor x index
            const ny = (y + dy + grid_height) % grid_height; // calculate neighbor y index
            count += grid[ny * grid_width + nx]; // count alive neighbor
        }
    }
    return count; // return total count
}

// function to draw grid lines
const grid_canvas = document.createElement('canvas'); // create a canvas for grid lines
grid_canvas.width = canvas.width; // set grid canvas width
grid_canvas.height = canvas.height; // set grid canvas height
const grid_ctx = grid_canvas.getContext('2d'); // 2d context for grid canvas
draw_grid_lines(); // draw grid lines on grid canvas
function draw_grid_lines() {
    grid_ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // set grid line color
    grid_ctx.beginPath(); // start a new path
    for (let x = 0; x <= grid_width; x++) {
        grid_ctx.moveTo(x * cell_size, 0); // move to start of vertical line
        grid_ctx.lineTo(x * cell_size, canvas.height); // draw vertical line
    }
    for (let y = 0; y <= grid_height; y++) {
        grid_ctx.moveTo(0, y * cell_size); // move to start of horizontal line
        grid_ctx.lineTo(canvas.width, y * cell_size); // draw horizontal line
    }
    grid_ctx.stroke(); // apply stroke
}

// function to draw the grid on the canvas
function draw_grid() {
    ctx.fillStyle = 'black'; // set background color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // fill background

    ctx.save(); // save current context
    ctx.translate(-offset_x * zoom, -offset_y * zoom); // apply translation for panning
    ctx.scale(zoom, zoom); // apply scaling for zoom

    ctx.fillStyle = 'white'; // set cell color
    for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
            const x = cell_coords[i * 2]; // get x position
            const y = cell_coords[i * 2 + 1]; // get y position
            ctx.fillRect(x, y, cell_size, cell_size); // draw cell
        }
    }
    
    if (show_grid) { // draw grid lines if enabled
        ctx.drawImage(grid_canvas, 0, 0);
    }
    ctx.restore(); // restore context
}

// function to start/stop the simulation
function toggle_running() {
    running = !running; // toggle running state
    document.getElementById('startButton').textContent = running ? 'stop' : 'start'; // update button text
    if (running) requestAnimationFrame(run_simulation); // start simulation loop
}

// function to run the simulation
function run_simulation(current_time) {
    if (!running) return; // exit if not running
    if (current_time - last_frame_time >= fps_interval) { // update if time has passed
        last_frame_time = current_time; // update last frame time
        update_grid(); // update grid based on game rules
        draw_grid(); // draw updated grid
    }
    requestAnimationFrame(run_simulation); // request next frame
}

// function to reset the grid to initial state
function reset_grid() {
    grid.fill(0); // set all cells to dead
    draw_grid(); // redraw grid
}

// utility function for debouncing
function debounce(func, wait) {
    let timeout; // debounce timeout
    return function executed_function(...args) {
        const later = () => {
            clearTimeout(timeout); // clear existing timeout
            func(...args); // call the function
        };
        clearTimeout(timeout); // clear existing timeout
        timeout = setTimeout(later, wait); // set new timeout
    };
}

// initial drawing of the grid
draw_grid(); // draw the initial grid
