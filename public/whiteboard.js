// Get the canvas element and set its dimensions to 80% of the window size
let canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

// Get the 2D rendering context for the canvas
let ctx = canvas.getContext("2d");

// Variables to store current mouse position and drawing state
let x;
let y;
let mouseDown = false;

// Event listener for when the mouse button is pressed down
window.onmousedown = (e) => {
    console.log(mouseDown);
    // Move the drawing cursor to the current mouse position
    ctx.moveTo(x, y);
    // Set the mouseDown flag to true
    mouseDown = true;
    // Emit a 'down' event with the current coordinates
    socket.emit('down', { x, y });
};

// Event listener for when the mouse button is released
window.onmouseup = (e) => {
    // Set the mouseDown flag to false
    mouseDown = false;
};

// Event listener for receiving 'ondraw' events from the server
socket.on('ondraw', ({ x, y }) => {
    // Draw a line to the received coordinates and update the canvas
    ctx.lineTo(x, y);
    ctx.stroke();
});

// Event listener for receiving 'ondown' events from the server
socket.on('ondown', ({ x, y }) => {
    // Move the drawing cursor to the received coordinates
    ctx.moveTo(x, y);
});

// Event listener for mouse movement over the canvas
window.onmousemove = function(e) {
    // Update the current mouse coordinates
    x = e.clientX;
    y = e.clientY - 55;
    // If the mouse button is down, draw a line and emit a 'draw' event
    if (mouseDown) {
        socket.emit('draw', { x, y });
        ctx.lineTo(x, y);
        ctx.stroke();
    }
};
