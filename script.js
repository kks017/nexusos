
"use strict";

/* NexusOS 1.0 */

const apps = ["files", "editor", "notes", "terminal", "calculator"];
const taskApps = document.getElementById("taskApps");
const startMenu = document.getElementById("startMenu");

let topWindow = 20;

/* Window Manager */

function openApp(name) {
    const win = document.getElementById(name);

    win.classList.remove("hidden");
    focusWindow(win);
    startMenu.classList.add("hidden");
    updateTaskbar();
}

function closeApp(name) {
    document.getElementById(name).classList.add("hidden");
    updateTaskbar();
}

function minimizeApp(name) {
    closeApp(name);
}

function focusWindow(win) {
    topWindow++;

    document.querySelectorAll(".window").forEach(function(w) {
        w.classList.remove("active");
    });

    win.classList.add("active");
    win.style.zIndex = topWindow;
}

function updateTaskbar() {
    taskApps.replaceChildren();

    apps.forEach(function(name) {
        const win = document.getElementById(name);
        const button = document.createElement("button");

        button.textContent = name;

        if (!win.classList.contains("hidden")) {
            button.classList.add("active");
        }

        button.onclick = function() {
            if (win.classList.contains("hidden")) {
                openApp(name);
            } else {
                minimizeApp(name);
            }
        };

        taskApps.appendChild(button);
    });
}

/* Drag Windows */

document.querySelectorAll(".window").forEach(function(win) {
    const bar = win.querySelector(".titlebar");

    let dragging = false;
    let xOffset = 0;
    let yOffset = 0;

    bar.addEventListener("pointerdown", function(event) {
        if (event.target.closest("button")) return;

        dragging = true;
        xOffset = event.clientX - win.offsetLeft;
        yOffset = event.clientY - win.offsetTop;

        bar.setPointerCapture(event.pointerId);
        focusWindow(win);
    });

    bar.addEventListener("pointermove", function(event) {
        if (!dragging) return;

        const maxX = Math.max(0, innerWidth - win.offsetWidth);
        const maxY = Math.max(0, innerHeight - 75);

        const x = event.clientX - xOffset;
        const y = event.clientY - yOffset;

        win.style.left = Math.max(0, Math.min(x, maxX)) + "px";
        win.style.top = Math.max(0, Math.min(y, maxY)) + "px";
    });

    bar.addEventListener("pointerup", function() {
        dragging = false;
    });

    bar.addEventListener("pointercancel", function() {
        dragging = false;
    });

    win.addEventListener("pointerdown", function() {
        focusWindow(win);
    });
});

/* Start Menu */

document.getElementById("startButton").onclick = function() {
    startMenu.classList.toggle("hidden");
};

/* Clock */

function updateClock() {
    document.getElementById("clock").textContent =
        new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
}

updateClock();
setInterval(updateClock, 1000);

/* Notes */

const notesText = document.getElementById("notesText");
const notesStatus = document.getElementById("notesStatus");

const oldNote = localStorage.getItem("nexus_note_v1");

try {
    if (oldNote) {
        notesText.value = JSON.parse(oldNote).content || "";
    } else {
        notesText.value = localStorage.getItem("nexusNotes") || "";
    }
} catch {
    notesText.value = localStorage.getItem("nexusNotes") || "";
}

notesText.addEventListener("input", function() {
    try {
        localStorage.setItem("nexusNotes", notesText.value);
        notesStatus.textContent = "Saved";
    } catch {
        notesStatus.textContent = "Save failed";
    }
});

/* File System */

const FILE_KEY = "nexus_files_final";

const defaultFiles = [
    {
        id: "documents",
        name: "Documents",
        type: "folder",
        parent: "root",
        content: ""
    },
    {
        id: "welcome",
        name: "Welcome.txt",
        type: "file",
        parent: "root",
        content: "Welcome to NexusOS!"
    }
];

let files;

try {
    const saved = JSON.parse(localStorage.getItem(FILE_KEY));

    if (Array.isArray(saved)) {
        files = saved;
    } else {
        files = defaultFiles;
    }
} catch {
    files = defaultFiles;
}

let currentFolder = "root";
let currentFile = null;

const fileList = document.getElementById("fileList");
const fileText = document.getElementById("fileText");

function saveFiles() {
    try {
        localStorage.setItem(FILE_KEY, JSON.stringify(files));
        return true;
    } catch {
        alert("Unable to save files.");
        return false;
    }
}

function createId() {
    return Date.now() + "-" + Math.random();
}

function findFile(id) {
    return files.find(function(file) {
        return file.id === id;
    });
}

function folderPath() {
    const parts = [];
    let id = currentFolder;

    while (id !== "root") {
        const folder = findFile(id);
        if (!folder) break;

        parts.unshift(folder.name);
        id = folder.parent;
    }

    return "Home / " + parts.join(" / ");
}

function renderFiles() {
    fileList.replaceChildren();

    document.getElementById("path").textContent = folderPath();

    const children = files.filter(function(file) {
        return file.parent === currentFolder;
    });

    children.forEach(function(file) {
        const button = document.createElement("button");
        button.className = "file-item";

        const icon = document.createElement("span");
        icon.textContent = file.type === "folder" ? "📁" : "📄";

        const name = document.createElement("small");
        name.textContent = file.name;

        button.append(icon, name);

        button.onclick = function() {
            if (file.type === "folder") {
                currentFolder = file.id;
                renderFiles();
            } else {
                openTextFile(file.id);
            }
        };

        button.oncontextmenu = function(event) {
            event.preventDefault();

            const action = prompt(
                'Type "rename" or "delete" for ' + file.name
            );

            if (action === "rename") renameFile(file.id);
            if (action === "delete") deleteFile(file.id);
        };

        fileList.appendChild(button);
    });

    document.getElementById("fileStatus").textContent =
        children.length + " items • Right-click to manage";
}

function newFolder() {
    createItem("folder");
}

function newFile() {
    createItem("file");
}

function createItem(type) {
    const name = prompt("Enter " + type + " name:");

    if (!name || !name.trim()) return;

    const cleanName = name.trim();

    const exists = files.some(function(file) {
        return file.parent === currentFolder &&
            file.name.toLowerCase() === cleanName.toLowerCase();
    });

    if (exists) {
        alert("That name already exists.");
        return;
    }

    const item = {
        id: createId(),
        name: cleanName,
        type: type,
        parent: currentFolder,
        content: ""
    };

    files.push(item);

    if (!saveFiles()) {
        files.pop();
        return;
    }

    renderFiles();
}

function goBack() {
    if (currentFolder === "root") return;

    const folder = findFile(currentFolder);
    currentFolder = folder ? folder.parent : "root";

    renderFiles();
}

function renameFile(id) {
    const file = findFile(id);
    if (!file) return;

    const name = prompt("Rename:", file.name);
    if (!name || !name.trim()) return;

    const cleanName = name.trim();

    const exists = files.some(function(other) {
        return other.id !== id &&
            other.parent === file.parent &&
            other.name.toLowerCase() === cleanName.toLowerCase();
    });

    if (exists) {
        alert("That name already exists.");
        return;
    }

    const oldName = file.name;
    file.name = cleanName;

    if (!saveFiles()) {
        file.name = oldName;
        return;
    }

    renderFiles();
}

function deleteFile(id) {
    const file = findFile(id);
    if (!file) return;

    if (!confirm("Delete " + file.name + "?")) return;

    const ids = new Set([id]);
    let changed = true;

    while (changed) {
        changed = false;

        files.forEach(function(item) {
            if (ids.has(item.parent) && !ids.has(item.id)) {
                ids.add(item.id);
                changed = true;
            }
        });
    }

    const previous = files;

    files = files.filter(function(item) {
        return !ids.has(item.id);
    });

    if (!saveFiles()) {
        files = previous;
        return;
    }

    if (ids.has(currentFile)) {
        currentFile = null;
        closeApp("editor");
    }

    renderFiles();
}

/* Text Editor */

function openTextFile(id) {
    const file = findFile(id);
    if (!file || file.type !== "file") return;

    currentFile = id;

    document.getElementById("editorTitle").textContent = file.name;
    document.getElementById("editorStatus").textContent = "Ready";
    fileText.value = file.content;

    openApp("editor");
}

fileText.addEventListener("input", function() {
    document.getElementById("editorStatus").textContent =
        "Unsaved changes";
});

function saveFile() {
    const file = findFile(currentFile);
    if (!file) return;

    const oldContent = file.content;
    file.content = fileText.value;

    if (!saveFiles()) {
        file.content = oldContent;
        return;
    }

    document.getElementById("editorStatus").textContent = "Saved";
}

/* Terminal */

const output = document.getElementById("output");
const command = document.getElementById("command");

function printLine(text) {
    output.textContent += "\n" + text;
    output.scrollTop = output.scrollHeight;
}

document.getElementById("terminalForm").onsubmit = function(event) {
    event.preventDefault();

    const text = command.value.trim();
    command.value = "";

    if (!text) return;

    printLine("NexusOS> " + text);

    const space = text.indexOf(" ");
    const action = (
        space === -1 ? text : text.slice(0, space)
    ).toLowerCase();

    const argument = space === -1 ? "" : text.slice(space + 1);

    switch (action) {
        case "help":
            printLine("help, clear, date, time, ls, echo, version");
            break;

        case "clear":
            output.textContent = "";
            break;

        case "date":
            printLine(new Date().toDateString());
            break;

        case "time":
            printLine(new Date().toLocaleTimeString());
            break;

        case "ls":
            printLine(
                files.filter(file => file.parent === currentFolder)
                    .map(file => file.name)
                    .join("\n") || "(empty)"
            );
            break;

        case "echo":
            printLine(argument);
            break;

        case "version":
            printLine("NexusOS 1.0");
            break;

        default:
            printLine("Unknown command");
    }
};

/* Calculator */

const calcDisplay = document.getElementById("calcDisplay");

let firstNumber = null;
let operation = null;
let startNewNumber = false;

function calcNumber(value) {
    if (startNewNumber) {
        calcDisplay.value = "0";
        startNewNumber = false;
    }

    if (value === "." && calcDisplay.value.includes(".")) {
        return;
    }

    if (value === ".") {
        calcDisplay.value += ".";
    } else if (calcDisplay.value === "0" ||
               calcDisplay.value === "Error") {
        calcDisplay.value = value;
    } else {
        calcDisplay.value += value;
    }
}

function calcOperator(op) {
    firstNumber = Number(calcDisplay.value);
    operation = op;
    startNewNumber = true;
}

function calcEquals() {
    if (firstNumber === null || !operation) return;

    const secondNumber = Number(calcDisplay.value);
    let result;

    switch (operation) {
        case "+": result = firstNumber + secondNumber; break;
        case "-": result = firstNumber - secondNumber; break;
        case "*": result = firstNumber * secondNumber; break;
        case "/": result = secondNumber === 0
            ? NaN : firstNumber / secondNumber; break;
    }

    calcDisplay.value = Number.isFinite(result)
        ? String(Number(result.toPrecision(12)))
        : "Error";

    firstNumber = null;
    operation = null;
    startNewNumber = true;
}

function calcClear() {
    calcDisplay.value = "0";
    firstNumber = null;
    operation = null;
    startNewNumber = false;
}

/* Start NexusOS */

renderFiles();
updateTaskbar();
openApp("files");
