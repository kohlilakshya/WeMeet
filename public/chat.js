// Initialize socket connection
// const socket = io.connect('http://localhost:4000');

// Query DOM elements
var message = document.getElementById('message');
var handle = USER_NAME;
var output = document.getElementById('output');
var feedback = document.getElementById('feedback');
const trashcan = document.getElementById('submit');

// Event listener for file upload
trashcan.addEventListener('click', (e) => {
    var f = document.getElementById('file');
    console.log("works");
    console.log(f.value);

    const endpoint = '/upload';
    const formData = new FormData();
    formData.append('file', f.files[0]);

    // AJAX request to upload file
    fetch(endpoint, {
        method: 'POST',
        body: formData
    })
        .then((response) => response.json())
        .then((data) => {
            // Emit file data to the server
            socket.emit('file', {
                message: data.fileLink,
                handle: USER_NAME
            });
        })
        .catch((err) => console.log(err));
});

// Event listener for message input
message.addEventListener('keypress', (event) => {
    if (event.key == 'Enter' && message.value.length != 0) {
        // Emit chat message to the server
        socket.emit('chat', {
            message: message.value,
            handle: USER_NAME
        });
        message.value = "";
        // feedback.innerHTML = "";
    } else {
        // Emit typing event to the server
        socket.emit('typing', USER_NAME);
    }
});

// Listen for chat messages
socket.on('chat', (data) => {
    if (data.handle == USER_NAME) {
        // Display message sent by the current user
        output.innerHTML += '<div class="d-flex flex-row justify-content-end"><p class="small p-2 me-0 ms-6 mb-1 text-black rounded-3" style="word-break: break-all; white-space: normal; min-width:125px; max-width:200px; background: #54B4D3"><strong>' + data.handle + ': </strong><br>' + data.message + '</p></div>';
    } else {
        // Display message sent by others
        output.innerHTML += '<div class="d-flex flex-row justify-content-start"><p class="small p-2 ms-0 me-6 mb-1 text-black rounded-3" style="word-break: break-all; white-space: normal; max-width:200px; min-width:125px; background: #FAED26"><strong class="text-white">' + data.handle + ': </strong><br>' + data.message + '</p></div>';
    }
    scrollToBottom();
});

// Listen for file messages
socket.on('file', (data) => {
    if (data.handle == USER_NAME) {
        // Display file link sent by the current user
        output.innerHTML += '<div class="d-flex flex-row justify-content-end"><p class="small p-2 me-0 ms-6 mb-1 text-black rounded-3" style="word-break: break-all; white-space: normal; min-width:125px; max-width:200px; background: #54B4D3"><strong>' + data.handle + ': </strong><br>' + '<a href="' + data.message + '">Download File</a>' + '</p></div>';
    } else {
        // Display file link sent by others
        output.innerHTML += '<div class="d-flex flex-row justify-content-start"><p class="small p-2 ms-0 me-6 mb-1 text-black rounded-3" style="word-break: break-all; white-space: normal; max-width:200px; min-width:125px; background: #FAED26"><strong class="text-white">' + data.handle + ': </strong><br>' + '<a href="' + data.message + '">Download File</a>' + '</p></div>';
    }
    scrollToBottom();
});

// Listen for typing events
socket.on('typing', (data) => {
    feedback.innerHTML = '<p><em>' + data + ' is typing a message...</em></p>';
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 2400);
});

// Scroll to the bottom of the chat window
const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}
