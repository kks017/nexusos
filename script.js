
"use strict";

/* =====================================
   NEXUSOS - CORE SYSTEM
   ===================================== */

const desktop = document.getElementById("desktop");
const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("startMenu");
const taskbarApps = document.getElementById("taskbarApps");
const clock = document.getElementById("clock");
const toast = document.getElementById("toast");

const windows = new Map();

let topZIndex = 20;
let toastTimeout = null;

const APP_NAMES = {
    welcome: "✨ Welcome",
    files: "📁 Files",
    editor: "📄 Editor",
    notes: "📝 Notes",
    terminal: "⌨️ Terminal",
    calculator: "🧮 Calculator",
    settings: "⚙️ Settings"
};

/* =====================================
   LOCAL STORAGE UTILITIES
   ===================================== */

function loadJSON(key, fallback) {
    try {
        const stored = localStorage.getItem(key);

        if (stored === null) {
            return fallback;
        }

        return JSON.parse(stored);
    } catch (error) {
        console.error("Storage loading error:", error);
        return fallback;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Storage saving error:", error);
        showToast("Could not save data.");
        return false;
    }
}

/* =====================================
   NOTIFICATIONS
   ===================================== */

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(function() {
        toast.classList.add("hidden");
    }, 2600);
}

/* =====================================
   WINDOW REGISTRATION
   ===================================== */

document.querySelectorAll("[data-window]").forEach(
    function(element) {
        const id = element.dataset.window;
        windows.set(id, element);
    }
);

function getWindow(appId) {
    return windows.get(appId);
}

function isWindowVisible(element) {
    return !element.classList.contains("hidden");
}

function focusWindow(element) {
    topZIndex++;

    windows.forEach(function(win) {
        win.classList.remove("active");
    });

    element.classList.add("active");
    element.style.zIndex = topZIndex;

    renderTaskbar();
}

function openApp(appId) {
    const element = getWindow(appId);

    if (!element) {
        showToast("Application not available.");
        return;
    }

    element.classList.remove("hidden");
    focusWindow(element);

    startMenu.classList.add("hidden");

    if (appId === "terminal") {
        document.getElementById("terminalInput").focus();
    }

    renderTaskbar();
}

function minimizeApp(appId) {
    const element = getWindow(appId);

    if (!element) return;

    element.classList.add("hidden");
    element.classList.remove("active");

    renderTaskbar();
}

function closeApp(appId) {
    minimizeApp(appId);
}

/* =====================================
   WINDOW DRAGGING
   ===================================== */

function makeDraggable(element) {
    const header = element.querySelector(".window-header");

    if (!header) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originalX = 0;
    let originalY = 0;

    header.addEventListener("pointerdown", function(event) {
        if (event.button !== 0) return;

        if (event.target.closest("button")) {
            return;
        }

        dragging = true;

        startX = event.clientX;
        startY = event.clientY;

        originalX = element.offsetLeft;
        originalY = element.offsetTop;

        header.setPointerCapture(event.pointerId);

        focusWindow(element);
    });

    header.addEventListener("pointermove", function(event) {
        if (!dragging) return;

        const differenceX = event.clientX - startX;
        const differenceY = event.clientY - startY;

        const maximumX = Math.max(
            0,
            desktop.clientWidth - element.offsetWidth
        );

        const maximumY = Math.max(
            0,
            desktop.clientHeight - 110
        );

        const nextX = Math.max(
            0,
            Math.min(originalX + differenceX, maximumX)
        );

        const nextY = Math.max(
            0,
            Math.min(originalY + differenceY, maximumY)
        );

        element.style.left = nextX + "px";
        element.style.top = nextY + "px";
    });

    function stopDragging() {
        dragging = false;
    }

    header.addEventListener("pointerup", stopDragging);
    header.addEventListener("pointercancel", stopDragging);

    element.addEventListener("pointerdown", function() {
        focusWindow(element);
    });
}

windows.forEach(function(element, appId) {
    makeDraggable(element);

    const minimizeButton = element.querySelector(
        '[data-action="minimize"]'
    );

    const closeButton = element.querySelector(
        '[data-action="close"]'
    );

    if (minimizeButton) {
        minimizeButton.addEventListener("click", function() {
            minimizeApp(appId);
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", function() {
            closeApp(appId);
        });
    }
});

/* =====================================
   TASKBAR
   ===================================== */

function renderTaskbar() {
    taskbarApps.replaceChildren();

    windows.forEach(function(element, appId) {
        const button = document.createElement("button");

        button.textContent = APP_NAMES[appId] || appId;
        button.className = element.classList.contains("active")
            && isWindowVisible(element)
            ? "active"
            : "";

        button.addEventListener("click", function() {
            if (
                isWindowVisible(element) &&
                element.classList.contains("active")
            ) {
                minimizeApp(appId);
            } else {
                openApp(appId);
            }
        });

        taskbarApps.appendChild(button);
    });
}

/* =====================================
   DESKTOP AND START MENU
   ===================================== */

document.querySelectorAll("[data-app]").forEach(
    function(button) {
        button.addEventListener("click", function() {
            openApp(button.dataset.app);
        });
    }
);

startButton.addEventListener("click", function(event) {
    event.stopPropagation();
    startMenu.classList.toggle("hidden");

    if (!startMenu.classList.contains("hidden")) {
        document.getElementById("appSearch").focus();
    }
});

desktop.addEventListener("pointerdown", function(event) {
    if (
        !event.target.closest("#startMenu") &&
        !event.target.closest("#startButton")
    ) {
        startMenu.classList.add("hidden");
    }
});

document.getElementById("exploreButton")
    .addEventListener("click", function() {
        openApp("files");
    });

document.getElementById("appSearch")
    .addEventListener("input", function(event) {
        const query = event.target.value.toLowerCase();

        document.querySelectorAll(".start-app-list button")
            .forEach(function(button) {
                const matches = button.textContent
                    .toLowerCase()
                    .includes(query);

                button.classList.toggle("hidden", !matches);
            });
    });

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        startMenu.classList.add("hidden");
    }
});

/* =====================================
   SYSTEM CLOCK
   ===================================== */

function updateClock() {
    const now = new Date();

    clock.textContent = now.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    clock.title = now.toLocaleDateString(
        [],
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}

updateClock();
setInterval(updateClock, 1000);

/* =====================================
   NOTES APPLICATION
   ===================================== */

const noteTitle = document.getElementById("noteTitle");
const notesText = document.getElementById("notesText");
const saveStatus = document.getElementById("saveStatus");
const noteWordCount = document.getElementById("noteWordCount");

const savedNote = loadJSON("nexus_note_v1", null);

if (savedNote && typeof savedNote === "object") {
    noteTitle.value = savedNote.title || "";
    notesText.value = savedNote.content || "";
} else {
    notesText.value = localStorage.getItem("nexusNotes") || "";
}

function updateWordCount() {
    const content = notesText.value.trim();

    const count = content
        ? content.split(/\s+/).length
        : 0;

    noteWordCount.textContent = count + " words";
}

function saveNotes() {
    const note = {
        title: noteTitle.value,
        content: notesText.value,
        updatedAt: new Date().toISOString()
    };

    saveStatus.textContent = "Saving...";

    const saved = saveJSON("nexus_note_v1", note);

    saveStatus.textContent = saved
        ? "All changes saved"
        : "Save failed";

    updateWordCount();
}

noteTitle.addEventListener("input", saveNotes);
notesText.addEventListener("input", saveNotes);

updateWordCount();

/* =====================================
   VIRTUAL FILE SYSTEM
   ===================================== */

const filesList = document.getElementById("filesList");
const filesStatus = document.getElementById("filesStatus");
const folderPath = document.getElementById("folderPath");

const DEFAULT_FILES = [
    {
        id: "documents",
        name: "Documents",
        type: "folder",
        parentId: "root",
        content: ""
    },
    {
        id: "projects",
        name: "Projects",
        type: "folder",
        parentId: "root",
        content: ""
    },
    {
        id: "readme",
        name: "Welcome.txt",
        type: "file",
        parentId: "root",
        content:
            "Welcome to NexusOS!\n\n" +
            "Create folders and text files to get started."
    }
];

let fileSystem = loadJSON("nexus_files_v1", null);

if (!Array.isArray(fileSystem)) {
    fileSystem = DEFAULT_FILES.map(function(item) {
        return { ...item };
    });

    saveJSON("nexus_files_v1", fileSystem);
}

let currentFolderId = "root";
let currentFileId = null;

function generateId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now() + "-" + Math.random();
}

function findItem(id) {
    return fileSystem.find(function(item) {
        return item.id === id;
    });
}

function getChildren(parentId) {
    return fileSystem.filter(function(item) {
        return item.parentId === parentId;
    });
}

function getFolderPath(folderId) {
    const names = [];
    const visited = new Set();

    let currentId = folderId;

    while (currentId !== "root") {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const folder = findItem(currentId);

        if (!folder) break;

        names.unshift(folder.name);
        currentId = folder.parentId;
    }

    return "/ Home" +
        (names.length ? " / " + names.join(" / ") : "");
}

function saveFileSystem() {
    return saveJSON("nexus_files_v1", fileSystem);
}

function openFolder(id) {
    if (id !== "root") {
        const item = findItem(id);

        if (!item || item.type !== "folder") return;
    }

    currentFolderId = id;
    renderFiles();
}

function createFileElement(item) {
    const button = document.createElement("button");

    button.className = "file-item";

    const icon = document.createElement("span");
    icon.className = "file-item-icon";
    icon.textContent = item.type === "folder"
        ? "📁"
        : "📄";

    const name = document.createElement("span");
    name.className = "file-item-name";
    name.textContent = item.name;

    button.append(icon, name);

    button.addEventListener("click", function() {
        if (item.type === "folder") {
            openFolder(item.id);
        } else {
            openTextFile(item.id);
        }
    });

    button.addEventListener("contextmenu", function(event) {
        event.preventDefault();

        const action = prompt(
            'Type "rename" or "delete" for ' + item.name
        );

        if (!action) return;

        if (action.toLowerCase() === "rename") {
            renameItem(item.id);
        }

        if (action.toLowerCase() === "delete") {
            deleteItem(item.id);
        }
    });

    return button;
}

function renderFiles() {
    filesList.replaceChildren();

    folderPath.textContent = getFolderPath(currentFolderId);

    const children = getChildren(currentFolderId);

    children.sort(function(a, b) {
        if (a.type !== b.type) {
            return a.type === "folder" ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
    });

    children.forEach(function(item) {
        filesList.appendChild(createFileElement(item));
    });

    filesStatus.textContent =
        children.length + " item(s) • Right-click to manage";

    if (children.length === 0) {
        filesStatus.textContent =
            "This folder is empty. Create something!";
    }
}

function nameExists(name, parentId) {
    return fileSystem.some(function(item) {
        return item.parentId === parentId &&
            item.name.toLowerCase() === name.toLowerCase();
    });
}

function createItem(type) {
    const name = prompt(
        type === "folder"
            ? "New folder name:"
            : "New text file name:"
    );

    if (name === null) return;

    const cleanName = name.trim();

    if (!cleanName) {
        showToast("Name cannot be empty.");
        return;
    }

    if (nameExists(cleanName, currentFolderId)) {
        showToast("An item with this name already exists.");
        return;
    }

    const item = {
        id: generateId(),
        name: cleanName,
        type: type,
        parentId: currentFolderId,
        content: ""
    };

    fileSystem.push(item);

    if (!saveFileSystem()) {
        fileSystem.pop();
        return;
    }

    renderFiles();
    showToast("Created " + cleanName);
}

function renameItem(id) {
    const item = findItem(id);

    if (!item) return;

    const newName = prompt("Rename item:", item.name);

    if (newName === null) return;

    const cleanName = newName.trim();

    if (!cleanName) return;

    const duplicate = fileSystem.some(function(other) {
        return other.id !== id &&
            other.parentId === item.parentId &&
            other.name.toLowerCase() === cleanName.toLowerCase();
    });

    if (duplicate) {
        showToast("That name already exists.");
        return;
    }

    const oldName = item.name;
    item.name = cleanName;

    if (!saveFileSystem()) {
        item.name = oldName;
        return;
    }

    renderFiles();
}

function collectDescendants(id) {
    const ids = new Set([id]);

    let changed = true;

    while (changed) {
        changed = false;

        fileSystem.forEach(function(item) {
            if (ids.has(item.parentId) && !ids.has(item.id)) {
                ids.add(item.id);
                changed = true;
            }
        });
    }

    return ids;
}

function deleteItem(id) {
    const item = findItem(id);

    if (!item) return;

    const confirmed = confirm(
        "Delete " + item.name +
        " and everything inside it?"
    );

    if (!confirmed) return;

    const idsToDelete = collectDescendants(id);

    const oldFileSystem = fileSystem;

    fileSystem = fileSystem.filter(function(entry) {
        return !idsToDelete.has(entry.id);
    });

    if (!saveFileSystem()) {
        fileSystem = oldFileSystem;
        return;
    }

    if (currentFileId && idsToDelete.has(currentFileId)) {
        currentFileId = null;
        closeApp("editor");
    }

    renderFiles();
}

document.getElementById("newFolderButton")
    .addEventListener("click", function() {
        createItem("folder");
    });

document.getElementById("newFileButton")
    .addEventListener("click", function() {
        createItem("file");
    });

document.getElementById("backFolderButton")
    .addEventListener("click", function() {
        if (currentFolderId === "root") return;

        const folder = findItem(currentFolderId);

        openFolder(folder ? folder.parentId : "root");
    });

document.getElementById("homeFolderButton")
    .addEventListener("click", function() {
        openFolder("root");
    });

document.getElementById("documentsFolderButton")
    .addEventListener("click", function() {
        openFolder("documents");
    });

renderFiles();

/* =====================================
   TEXT EDITOR
   ===================================== */

const fileEditor = document.getElementById("fileEditor");
const editorTitle = document.getElementById("editorTitle");
const editorStatus = document.getElementById("editorStatus");

function openTextFile(id) {
    const file = findItem(id);

    if (!file || file.type !== "file") return;

    currentFileId = id;

    editorTitle.textContent = file.name;
    fileEditor.value = file.content || "";

    editorStatus.textContent = "Ready";

    openApp("editor");
}

fileEditor.addEventListener("input", function() {
    editorStatus.textContent = "Unsaved changes";
});

document.getElementById("saveFileButton")
    .addEventListener("click", function() {
        const file = findItem(currentFileId);

        if (!file) {
            showToast("No file selected.");
            return;
        }

        const previousContent = file.content;
        file.content = fileEditor.value;

        if (!saveFileSystem()) {
            file.content = previousContent;
            editorStatus.textContent = "Save failed";
            return;
        }

        editorStatus.textContent = "Saved successfully";
        showToast("File saved");
    });

/* =====================================
   TERMINAL
   ===================================== */

const terminalOutput = document.getElementById(
    "terminalOutput"
);

const terminalInput = document.getElementById(
    "terminalInput"
);

const terminalForm = document.getElementById(
    "terminalForm"
);

function printTerminal(message) {
    const line = document.createElement("div");
    line.textContent = message;

    terminalOutput.appendChild(line);

    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function handleTerminalCommand(rawCommand) {
    const trimmed = rawCommand.trim();

    if (!trimmed) return;

    printTerminal("nexus@home:~$ " + trimmed);

    const firstSpace = trimmed.indexOf(" ");

    const command = (
        firstSpace === -1
            ? trimmed
            : trimmed.slice(0, firstSpace)
    ).toLowerCase();

    const argument = firstSpace === -1
        ? ""
        : trimmed.slice(firstSpace + 1).trim();

    switch (command) {

        case "help":
            printTerminal(
                "Available commands:\n" +
                "help      Show commands\n" +
                "clear     Clear terminal\n" +
                "date      Display date\n" +
                "time      Display time\n" +
                "whoami    Display user\n" +
                "echo      Print text\n" +
                "ls        List current folder\n" +
                "pwd       Show folder path\n" +
                "open      Open an application\n" +
                "about     About NexusOS\n" +
                "version   Show version"
            );
            break;

        case "clear":
            terminalOutput.replaceChildren();
            break;

        case "date":
            printTerminal(new Date().toDateString());
            break;

        case "time":
            printTerminal(new Date().toLocaleTimeString());
            break;

        case "whoami":
            printTerminal("nexus-user");
            break;

        case "echo":
            printTerminal(argument);
            break;

        case "ls":
            printTerminal(
                getChildren(currentFolderId)
                    .map(item => item.name)
                    .join("\n") || "(empty)"
            );
            break;

        case "pwd":
            printTerminal(getFolderPath(currentFolderId));
            break;

        case "open":
            if (windows.has(argument.toLowerCase())) {
                openApp(argument.toLowerCase());
            } else {
                printTerminal(
                    "Unknown application. Try: files, notes, settings."
                );
            }
            break;

        case "about":
            printTerminal(
                "NexusOS is a browser-based desktop environment."
            );
            break;

        case "version":
            printTerminal("NexusOS v1.0");
            break;

        default:
            printTerminal(
                "Command not found: " + command +
                "\nType 'help' for commands."
            );
    }
}

terminalForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const command = terminalInput.value;

    terminalInput.value = "";

    handleTerminalCommand(command);
});

/* =====================================
   CALCULATOR
   ===================================== */

const calculatorDisplay = document.getElementById(
    "calculatorDisplay"
);

let calculatorValue = "0";
let storedNumber = null;
let pendingOperator = null;
let waitingForNextNumber = false;

function updateCalculatorDisplay() {
    calculatorDisplay.value = calculatorValue;
}

function appendDigit(digit) {
    if (waitingForNextNumber) {
        calculatorValue = digit;
        waitingForNextNumber = false;
    } else {
        calculatorValue = calculatorValue === "0"
            ? digit
            : calculatorValue + digit;
    }

    updateCalculatorDisplay();
}

function appendDecimal() {
    if (waitingForNextNumber) {
        calculatorValue = "0.";
        waitingForNextNumber = false;
    } else if (!calculatorValue.includes(".")) {
        calculatorValue += ".";
    }

    updateCalculatorDisplay();
}

function calculate(a, b, operator) {
    switch (operator) {
        case "add":
            return a + b;

        case "subtract":
            return a - b;

        case "multiply":
            return a * b;

        case "divide":
            return b === 0 ? NaN : a / b;

        default:
            return b;
    }
}

function handleCalculatorInput(action) {
    if (/^\d$/.test(action)) {
        appendDigit(action);
        return;
    }

    if (action === "decimal") {
        appendDecimal();
        return;
    }

    if (action === "clear") {
        calculatorValue = "0";
        storedNumber = null;
        pendingOperator = null;
        waitingForNextNumber = false;
    }

    if (action === "backspace") {
        calculatorValue = calculatorValue.length > 1
            ? calculatorValue.slice(0, -1)
            : "0";
    }

    if (action === "sign") {
        calculatorValue = String(
            Number(calculatorValue) * -1
        );
    }

    if (action === "percent") {
        calculatorValue = String(
            Number(calculatorValue) / 100
        );
    }

    if (["add", "subtract", "multiply", "divide"]
        .includes(action)) {

        if (pendingOperator !== null && !waitingForNextNumber) {
            const result = calculate(
                storedNumber,
                Number(calculatorValue),
                pendingOperator
            );

            calculatorValue = String(result);
        }

        storedNumber = Number(calculatorValue);
        pendingOperator = action;
        waitingForNextNumber = true;
    }

    if (action === "equals") {
        if (pendingOperator !== null && storedNumber !== null) {
            const result = calculate(
                storedNumber,
                Number(calculatorValue),
                pendingOperator
            );

            calculatorValue = Number.isFinite(result)
                ? String(Number(result.toPrecision(12)))
                : "Error";

            storedNumber = null;
            pendingOperator = null;
            waitingForNextNumber = true;
        }
    }

    updateCalculatorDisplay();
}

document.querySelectorAll("[data-calc]").forEach(
    function(button) {
        button.addEventListener("click", function() {
            handleCalculatorInput(button.dataset.calc);
        });
    }
);

/* =====================================
   THEMES AND SETTINGS
   ===================================== */

const availableThemes = [
    "ocean",
    "sunset",
    "forest",
    "midnight"
];

function applyTheme(theme) {
    if (!availableThemes.includes(theme)) {
        return;
    }

    availableThemes.forEach(function(name) {
        desktop.classList.remove("theme-" + name);
    });

    desktop.classList.add("theme-" + theme);

    try {
        localStorage.setItem("nexus_theme", theme);
    } catch (error) {
        console.warn("Could not save theme:", error);
    }

    showToast("Theme changed to " + theme);
}

document.querySelectorAll("[data-theme]").forEach(
    function(button) {
        button.addEventListener("click", function() {
            applyTheme(button.dataset.theme);
        });
    }
);

const savedTheme = localStorage.getItem("nexus_theme");

if (availableThemes.includes(savedTheme)) {
    applyTheme(savedTheme);
}

/* =====================================
   SYSTEM INITIALIZATION
   ===================================== */

function initializeNexusOS() {
    const welcome = getWindow("welcome");

    welcome.classList.remove("hidden");
    focusWindow(welcome);

    renderTaskbar();
    updateClock();

    console.log("NexusOS v1.0 initialized successfully.");
}

initializeNexusOS();


