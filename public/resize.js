const videoContainer = document.getElementById("video-grid");

// Function to resize video elements
function resizeVideos() {
    console.log("Resizing videos");
    
    var cont = document.getElementById('video-grid');
    var videos = document.querySelectorAll('video');

    const len = videos.length;
    const containerWidth = cont.offsetWidth * 0.8;
    const containerHeight = cont.offsetHeight * 0.8;

    for (var i = 0; i < len; i++) {
        videos[i].style.width = `${containerWidth / len}px`;
        videos[i].style.height = `${containerHeight / len}px`;
    }
}

// Add event listener for window resize
window.addEventListener('resize', resizeVideos);

// Configuration for MutationObserver
var config = { attributes: true, childList: true, characterData: true };

// Create an observer instance
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        resizeVideos();
    });
});

// Start observing the target node for changes
observer.observe(videoContainer, config);

// Stop observing (if needed)
// observer.disconnect();
