const welcomeWindow = document.getElementById("welcomeWindow");
const windowHeader = welcomeWindow.querySelector(".window-header");
const closeWelcome = document.getElementById("closeWelcome");
const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("startMenu");
const clock = document.getElementById("clock");
const exploreButton = document.getElementById("exploreButton");

if (exploreButton) {
    exploreButton.addEventListener("click", function () {
        alert("NexusOS is just getting started.");
    });
}

/* DRAGGABLE WINDOW */
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

windowHeader.addEventListener("mousedown", function (event) {
    isDragging = true;
    offsetX = event.clientX - welcomeWindow.offsetLeft;
    offsetY = event.clientY - welcomeWindow.offsetTop;
});

document.addEventListener("mousemove", function (event) {
    if (!isDragging) return;

    welcomeWindow.style.left = event.clientX - offsetX + "px";
    welcomeWindow.style.top = event.clientY - offsetY + "px";
});

document.addEventListener("mouseup", function () {
    isDragging = false;
});

/* CLOSE WINDOW */
closeWelcome.addEventListener("click", function () {
    welcomeWindow.style.display = "none";
});

/* START MENU */
startButton.addEventListener("click", function () {
    if (startMenu.style.display === "block") {
        startMenu.style.display = "none";
    } else {
        startMenu.style.display = "block";
    }
});

/* CLOCK */
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    clock.textContent = hours + ":" + minutes;
}

updateClock();
setInterval(updateClock, 1000);

/* NEXUS NOTES APPLICATION */

// Find the Notes elemtents in the HTML
const notesWindow = document.getElementById("notesWindow");
const notesIcon = document.getElementById("notesIcon");
const closeNotes = document.getElementById("closeNotes");
const notesText = document.getElementById("notesText");
const saveStatus = document.getElementById("saveStatus");

// Open Notes when clicking the desktop icon
notesIcon.addEventListener("click", function () {
    notesWindow.style.display = "block";
});

// Close the Notes Window
closeNotes.addEventListener("click", function () {
    notesWindow.style.display = "none";
});

// Close the Notes window
closeNotes.addEventListener("click", function () {
    notesWindow.style.display = "none";
});

//Load notes saved from a previous session
notesText.value = localStorage.getItem("nexusNotes") || "";

//Automatically save whenever the user types
notesText.addEventListener("input", function() {
    localStorage.setItem("nexusNotes", notesText.value);
    saveStatus.textContent = "All changes Saved";
});