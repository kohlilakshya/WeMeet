// Initialize socket connection
const socket = io('/');

// Emit a join-room event with room ID, user name, and additional data
socket.emit('join-room', ROOM_ID, USER_NAME, goog);

var screenSharing = false;
const myVideo = document.createElement('video');
var mystream;
var myscreen;
myVideo.muted = true;
const peers = {};
const videoGrid = document.getElementById('video-grid');
var myPeer;
var gum = navigator.mediaDevices.getUserMedia;

// Handle rejection event
socket.on('reject', () => {
    window.location.href = "/rej";
});

// Handle successful join event
socket.on('ok-join', () => {
    myPeer = new Peer(undefined, {
        // Configuration for PeerJS (commented out for default settings)
    });

    // Event when PeerJS connection opens
    myPeer.on('open', id => {
        gum({ video: true, audio: true }).then(stream => {
            mystream = stream;
            addVideoStream(myVideo, stream);
            socket.emit('join', ROOM_ID, id, goog);
        });
    });

    // Handle incoming calls
    myPeer.on('call', call => {
        peers[call.peer] = call;
        const video = document.createElement('video');

        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });

        call.answer(mystream);

        call.on('close', () => {
            video.remove();
        });
    });

    // Handle new user connection
    socket.on('user-connected', userId => {
        console.log(userId, "connected");
        connectToNewUser(userId, mystream);
    });

    // Handle user disconnection
    socket.on('user-disconnected', userId => {
        console.log(userId, "disconnected");
        if (peers[userId]) peers[userId].close();
    });

    // Handle request to join
    socket.on('wants to join', (name, id, googleId) => {
        var myModal = document.getElementById('myModal');
        myModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-bs-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h3>${name} wants to join the meeting</h3>
                    </div>
                    <div class="modal-footer">
                        <button onclick="okay('${id}', '${googleId}')" type="button" class="btn btn-default" data-bs-dismiss="modal">Allow</button>
                        <button onclick="nokay('${id}')" type="button" class="btn btn-default" data-bs-dismiss="modal">Deny</button>
                    </div>
                </div>
            </div>
        `;
        var mod = new bootstrap.Modal(myModal);
        mod.show();
    });
});

// Function to allow a user to join
function okay(id, googleId) {
    socket.emit('ok-join', id, googleId);
}

// Function to deny a user joining
function nokay(id) {
    socket.emit('reject', id);
}

// Function to connect to a new user
function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });

    call.on('close', () => {
        video.remove();
    });

    peers[userId] = call;
}

// Function to add video stream to the video grid
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.appendChild(video);
}

// Function to toggle mute/unmute
const muteUnmute = () => {
    const enabled = mystream.getAudioTracks()[0].enabled;
    if (enabled) {
        mystream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        mystream.getAudioTracks()[0].enabled = true;
    }
}

// Function to toggle video on/off
const playStop = () => {
    let enabled = mystream.getVideoTracks()[0].enabled;
    if (enabled) {
        mystream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        mystream.getVideoTracks()[0].enabled = true;
    }
}

// Set button text for mute
const setMuteButton = () => {
    const html = `
        <i class="fas fa-microphone"></i>
        <span>Mute</span>
    `;
    document.getElementById('mute').innerHTML = html;
}

// Set button text for unmute
const setUnmuteButton = () => {
    const html = `
        <i class="unmute fas fa-microphone-slash"></i>
        <span>Unmute</span>
    `;
    document.getElementById('mute').innerHTML = html;
}

// Set button text for stopping video
const setStopVideo = () => {
    const html = `
        <i class="fas fa-video"></i>
        <span>Stop Video</span>
    `;
    document.getElementById('video_button').innerHTML = html;
}

// Set button text for playing video
const setPlayVideo = () => {
    const html = `
        <i class="stop fas fa-video-slash"></i>
        <span>Play Video</span>
    `;
    document.getElementById('video_button').innerHTML = html;
}

// Function to start screen sharing
function startScreenShare() {
    if (screenSharing) {
        var element = document.getElementById("share");
        element.parentElement.removeChild(element);
        stopScreenSharing();
    } else {
        navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
            myscreen = stream;
            const v = document.createElement('video');
            v.setAttribute("id", "share");

            let videoTrack = myscreen.getVideoTracks()[0];
            addVideoStream(v, myscreen);
            videoTrack.onended = () => {
                stopScreenSharing();
            };

            if (myPeer) {
                for (const key in peers) {
                    let fren = peers[key];
                    let sender = fren.peerConnection.getSenders().find(s => s.track.kind === videoTrack.kind);
                    sender.replaceTrack(videoTrack);
                }
                screenSharing = true;
            }
        });
    }
}

// Function to stop screen sharing
function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = mystream.getVideoTracks()[0];
    if (myPeer) {
        for (const key in peers) {
            let fren = peers[key];
            let sender = fren.peerConnection.getSenders().find(s => s.track.kind === videoTrack.kind);
            sender.replaceTrack(videoTrack);
        }
    }
    myscreen.getTracks().forEach(track => track.stop());
    screenSharing = false;
}
