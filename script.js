const welcomeWindow = document.getElementById("welcomeWindow");
const windowHeader = welcomeWindow.querySelector(".window-header");
const closeWelcome = document.getElementById("closeWelcome");
const minimizeWelcome = document.getElementById("minimizeWelcome");
const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("startMenu");
const clock = document.getElementById("clock");
const exploreButton = document.getElementById("exploreButton");
const welcomeTaskButton = document.getElementById("welcomeTaskButton");
const notesTaskButton = document.getElementById("notesTaskButton");

if (exploreButton) {
    exploreButton.addEventListener("click", function () {
        alert("NexusOS is just getting started.");
    });
}

/* NEXUSOS WINDOW MANAGER */

let highestZIndex = 20;

const allWindows = document.querySelectorAll(".window");

function focusWindow(windowElement) {
    highestZIndex++;

    allWindows.forEach(function(win) {
        win.classList.remove("active");
    });
    windowElement.classList.add("active");
    windowElement.style.zIndex = highestZIndex;
}

function makeDraggable(windowElement) {
    const header = windowElement.querySelector(".window-header");

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("pointerdown", function(event) {
        if (event.target.closest("button")) return;

        dragging = true;

        offsetX = event.clientX - windowElement.offsetLeft;
        offsetY = event.clientY - windowElement.offsetTop;

        header.setPointerCapture(event.pointerId);
        focusWindow(windowElement);
    });

    header.addEventListener("pointermove", function(event) {
        if (!dragging) return;

        const desktop = document.getElementById("desktop");

        let newX = event.clientX - offsetX;
        let newY = event.clientY - offsetY;

        newX = Math.max(
            0,
            Math.min(newX, desktop.clientWidth - windowElement.offsetWidth)
        );

        newY = Math.max(
            0,
            Math.min(newY, desktop.clientHeight - 55 - header.offsetHeight)
        );

        windowElement.style.left = newX + "px";
        windowElement.style.top = newY + "px";
    });

    function stopDragging() {
        dragging = false;
    }

    header.addEventListener("pointerup", stopDragging);
    header.addEventListener("pointercancel", stopDragging);
}

allWindows.forEach(function(win) {
    makeDraggable(win);
    win.addEventListener("pointerdown", function() {
        focusWindow(win);
    });
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
const minimizeNotes = document.getElementById("minimizeNotes");
const notesText = document.getElementById("notesText");
const saveStatus = document.getElementById("saveStatus");

// Open Notes when clicking the desktop icon
notesIcon.addEventListener("click", function () {
    restoreWindow(notesWindow);
});

// Close the Notes Window
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


function minimizeWindow(windowElement) {
    windowElement.style.display = "none";
}

function restoreWindow(windowElement) {
    windowElement.style.display = "block";
    focusWindow(windowElement);
}

minimizeWelcome.addEventListener("click", function() {
    minimizeWindow(welcomeWindow);
});

minimizeNotes.addEventListener("click", function() {
    minimizeWindow(notesWindow);
});

welcomeTaskButton.addEventListener("click", function() {
    restoreWindow(welcomeWindow);
});

notesTaskButton.addEventListener("click", function() {
    restoreWindow(notesWindow);
});


/* NEXUS FILE MANAGER */

// Get HTML elements
const filesWindow = document.getElementById("filesWindow");
const computerIcon = document.getElementById("computerIcon");
const closeFiles = document.getElementById("closeFiles");
const minimizeFiles = document.getElementById("minimizeFiles");
const filesTaskButton = document.getElementById("filesTaskButton");
const newFolderButton = document.getElementById("newFolderButton");
const filesList = document.getElementById("filesList");
const filesStatus = document.getElementById("filesStatus");

// Load previously saved folders
let folders = [];

try {
    const savedFolders = JSON.parse(
        localStorage.getItem("nexusFolders") || "[]"
    );

    if (Array.isArray(savedFolders)) {
        folders = savedFolders.filter(
            name => typeof name === "string"
        );
    }
} catch (error) {
    console.error("Failed to load folders:", error);
}

// Display all folders
function renderFolders() {
    filesList.replaceChildren();

    folders.forEach(function(folderName) {
        const folderItem = document.createElement("div");
        folderItem.className = "file-item";

        const icon = document.createElement("div");
        icon.className = "folder-icon";
        icon.textContent = "📁";

        const name = document.createElement("div");
        name.className = "folder-name";
        name.textContent = folderName;

        folderItem.appendChild(icon);
        folderItem.appendChild(name);

        filesList.appendChild(folderItem);
    });

    filesStatus.textContent =
        folders.length + " folder(s)";
}

// Create a new folder
newFolderButton.addEventListener("click", function() {
    const folderName = prompt("Enter a folder name:");

    if (folderName === null) return;

    const cleanName = folderName.trim();

    if (cleanName === "") {
        alert("Folder name cannot be empty.");
        return;
    }

    if (folders.includes(cleanName)) {
        alert("This folder already exists.");
        return;
    }

    const updatedFolders = [...folders, cleanName];

    try {
        localStorage.setItem(
            "nexusFolders",
            JSON.stringify(updatedFolders)
        );

        folders = updatedFolders;
        renderFolders();
    } catch (error) {
        console.error("Failed to save folder:", error);
        alert("Could not save the folder.");
    }
});

// Open File Manager
computerIcon.addEventListener("click", function() {
    restoreWindow(filesWindow);
});

// Close File Manager
closeFiles.addEventListener("click", function() {
    filesWindow.style.display = "none";
});

// Minimize File Manager
minimizeFiles.addEventListener("click", function() {
    minimizeWindow(filesWindow);
});

// Restore from taskbar
filesTaskButton.addEventListener("click", function() {
    restoreWindow(filesWindow);
});

// Display saved folders when NexusOS starts
renderFolders();