
"use strict";

/* ========================================
   NEXUSOS v1.1 - MAIN JAVASCRIPT
   ======================================== */

/* GENERAL VARIABLES */

const desktop = document.getElementById("desktop");
const startMenu = document.getElementById("startMenu");
const taskbarApps = document.getElementById("taskbarApps");
const notification = document.getElementById("notification");

const appNames = {
    files: "My Computer",
    editor: "Text Editor",
    notes: "Notes",
    terminal: "Terminal",
    calculator: "Calculator"
};

let highestWindow = 20;
let notificationTimer = null;

/* ========================================
   HELPER FUNCTIONS
   ======================================== */

function getElement(id) {
    return document.getElementById(id);
}

function showMessage(message) {
    notification.textContent = message;
    notification.classList.remove("hidden");

    clearTimeout(notificationTimer);

    notificationTimer = setTimeout(function() {
        notification.classList.add("hidden");
    }, 2500);
}

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);

        if (saved === null) {
            return fallback;
        }

        return JSON.parse(saved);
    } catch (error) {
        console.error("Load error:", error);
        return fallback;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

        return true;
    } catch (error) {
        console.error("Save error:", error);
        showMessage("Unable to save data.");
        return false;
    }
}

/* ========================================
   WINDOW MANAGER
   ======================================== */

function getWindow(name) {
    return getElement(name + "Window");
}

function focusWindow(win) {
    highestWindow++;

    document.querySelectorAll(".window")
        .forEach(function(other) {
            other.classList.remove("active");
        });

    win.classList.add("active");
    win.style.zIndex = highestWindow;

    updateTaskbar();
}

function openApp(name) {
    const win = getWindow(name);

    if (!win) return;

    win.classList.remove("hidden");

    focusWindow(win);

    startMenu.classList.add("hidden");

    if (name === "terminal") {
        getElement("terminalInput").focus();
    }
}

function closeApp(name) {
    const win = getWindow(name);

    if (!win) return;

    if (name === "editor" && hasUnsavedFile()) {
        if (!confirm("Discard unsaved file changes?")) {
            return;
        }
    }

    win.classList.add("hidden");
    win.classList.remove("active");

    updateTaskbar();
}

function minimizeApp(name) {
    const win = getWindow(name);

    if (!win) return;

    win.classList.add("hidden");
    win.classList.remove("active");

    updateTaskbar();
}

function updateTaskbar() {
    taskbarApps.replaceChildren();

    Object.keys(appNames).forEach(function(name) {
        const win = getWindow(name);

        const button = document.createElement("button");

        button.textContent = appNames[name];

        if (
            !win.classList.contains("hidden") &&
            win.classList.contains("active")
        ) {
            button.classList.add("active");
        }

        button.addEventListener("click", function() {
            if (
                !win.classList.contains("hidden") &&
                win.classList.contains("active")
            ) {
                minimizeApp(name);
            } else {
                openApp(name);
            }
        });

        taskbarApps.appendChild(button);
    });
}

/* WINDOW BUTTONS */

document.querySelectorAll("[data-minimize]")
    .forEach(function(button) {
        button.addEventListener("click", function() {
            minimizeApp(button.dataset.minimize);
        });
    });

document.querySelectorAll("[data-close]")
    .forEach(function(button) {
        button.addEventListener("click", function() {
            closeApp(button.dataset.close);
        });
    });

/* DRAGGABLE WINDOWS */

document.querySelectorAll(".window")
    .forEach(function(win) {
        const titlebar = win.querySelector(".titlebar");

        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        titlebar.addEventListener(
            "pointerdown",
            function(event) {
                if (event.button !== 0) return;
                if (event.target.closest("button")) return;

                dragging = true;

                offsetX = event.clientX - win.offsetLeft;
                offsetY = event.clientY - win.offsetTop;

                titlebar.setPointerCapture(event.pointerId);

                focusWindow(win);
            }
        );

        titlebar.addEventListener(
            "pointermove",
            function(event) {
                if (!dragging) return;

                const maxX = Math.max(
                    0,
                    desktop.clientWidth - win.offsetWidth
                );

                const maxY = Math.max(
                    0,
                    desktop.clientHeight - 80
                );

                const x = event.clientX - offsetX;
                const y = event.clientY - offsetY;

                win.style.left =
                    Math.max(0, Math.min(x, maxX)) + "px";

                win.style.top =
                    Math.max(0, Math.min(y, maxY)) + "px";
            }
        );

        function stopDragging() {
            dragging = false;
        }

        titlebar.addEventListener(
            "pointerup",
            stopDragging
        );

        titlebar.addEventListener(
            "pointercancel",
            stopDragging
        );

        win.addEventListener("pointerdown", function() {
            focusWindow(win);
        });
    });

/* ========================================
   START MENU AND DESKTOP
   ======================================== */

document.querySelectorAll("[data-open]")
    .forEach(function(button) {
        button.addEventListener("click", function() {
            openApp(button.dataset.open);
        });
    });

getElement("startButton")
    .addEventListener("click", function(event) {
        event.stopPropagation();

        startMenu.classList.toggle("hidden");
    });

document.addEventListener("pointerdown", function(event) {
    if (
        !event.target.closest("#startMenu") &&
        !event.target.closest("#startButton")
    ) {
        startMenu.classList.add("hidden");
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        startMenu.classList.add("hidden");
    }
});

getElement("showDesktopButton")
    .addEventListener("click", function() {
        Object.keys(appNames).forEach(function(name) {
            minimizeApp(name);
        });
    });

/* ========================================
   CLOCK
   ======================================== */

function updateClock() {
    const now = new Date();

    const formattedTime = now.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    getElement("clock").textContent = formattedTime;

    getElement("clock").title = now.toDateString();
}

updateClock();

setInterval(updateClock, 1000);

/* ========================================
   NOTES APPLICATION
   ======================================== */

const noteTitle = getElement("noteTitle");
const notesText = getElement("notesText");
const notesStatus = getElement("notesStatus");
const wordCount = getElement("wordCount");

const NOTE_KEY = "nexus_note_v1";

function loadNotes() {
    const saved = loadData(NOTE_KEY, null);

    if (saved && typeof saved === "object") {
        noteTitle.value = saved.title || "";
        notesText.value = saved.content || "";
    } else {
        notesText.value =
            localStorage.getItem("nexusNotes") || "";
    }

    updateWordCount();
}

function updateWordCount() {
    const text = notesText.value.trim();

    const count = text
        ? text.split(/\s+/).length
        : 0;

    wordCount.textContent = count + " words";
}

function saveNotes() {
    const note = {
        title: noteTitle.value,
        content: notesText.value,
        updated: new Date().toISOString()
    };

    notesStatus.textContent = "Saving...";

    const saved = saveData(NOTE_KEY, note);

    notesStatus.textContent = saved
        ? "Saved"
        : "Save failed";

    updateWordCount();
}

noteTitle.addEventListener("input", saveNotes);
notesText.addEventListener("input", saveNotes);

getElement("clearNotesButton")
    .addEventListener("click", function() {
        if (!confirm("Clear your note?")) return;

        notesText.value = "";
        saveNotes();
    });

loadNotes();

/* ========================================
   VIRTUAL FILE SYSTEM
   ======================================== */

const FILE_KEY = "nexus_files_beginner_v11";

const defaultFiles = [
    {
        id: "documents",
        name: "Documents",
        type: "folder",
        parent: "root",
        content: ""
    },
    {
        id: "projects",
        name: "Projects",
        type: "folder",
        parent: "root",
        content: ""
    },
    {
        id: "welcome",
        name: "Welcome.txt",
        type: "file",
        parent: "root",
        content:
            "Welcome to NexusOS!\n\n" +
            "Create your own folders and text files."
    }
];

function migrateOlderFiles() {
    const oldKeys = [
        "nexus_files_final",
        "nexus_files_v13",
        "nexus_files_retro",
        "nexus_files_v1"
    ];

    for (const key of oldKeys) {
        const oldFiles = loadData(key, null);

        if (!Array.isArray(oldFiles)) continue;

        return oldFiles.map(function(item) {
            return {
                id: String(item.id),
                name: String(item.name),
                type: item.type,
                parent: item.parent ?? item.parentId ?? "root",
                content: item.content || ""
            };
        });
    }

    return null;
}

let files = loadData(FILE_KEY, null);

if (!Array.isArray(files)) {
    files = migrateOlderFiles() ||
        defaultFiles.map(function(item) {
            return { ...item };
        });

    saveData(FILE_KEY, files);
}

let currentFolder = "root";
let currentFileId = null;
let savedEditorContent = "";

const fileList = getElement("fileList");
const folderPathElement = getElement("folderPath");
const fileStatus = getElement("fileStatus");
const fileSearch = getElement("fileSearch");
const fileSort = getElement("fileSort");

function createId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return Date.now() + "-" + Math.random();
}

function findFile(id) {
    return files.find(function(file) {
        return file.id === id;
    });
}

function getChildren(parentId) {
    return files.filter(function(file) {
        return file.parent === parentId;
    });
}

function saveFiles() {
    return saveData(FILE_KEY, files);
}

function fileNameExists(name, parent, excludeId = null) {
    return files.some(function(file) {
        return file.id !== excludeId &&
            file.parent === parent &&
            file.name.toLowerCase() === name.toLowerCase();
    });
}

/* FOLDER PATH */

function getFolderPath() {
    const parts = [];

    const visited = new Set();

    let folderId = currentFolder;

    while (folderId !== "root") {
        if (visited.has(folderId)) break;

        visited.add(folderId);

        const folder = findFile(folderId);

        if (!folder) break;

        parts.unshift(folder.name);

        folderId = folder.parent;
    }

    return "Home" +
        (parts.length ? " / " + parts.join(" / ") : "");
}

/* NAVIGATION */

function openFolder(id) {
    if (id !== "root") {
        const folder = findFile(id);

        if (!folder || folder.type !== "folder") {
            return;
        }
    }

    currentFolder = id;

    fileSearch.value = "";

    renderFiles();
}

function goBack() {
    if (currentFolder === "root") return;

    const folder = findFile(currentFolder);

    openFolder(folder ? folder.parent : "root");
}

getElement("backButton")
    .addEventListener("click", goBack);

getElement("homeButton")
    .addEventListener("click", function() {
        openFolder("root");
    });

/* SEARCH AND SORT */

fileSearch.addEventListener("input", function() {
    renderFiles();
});

fileSort.addEventListener("change", function() {
    renderFiles();
});

function getVisibleFiles() {
    const search = fileSearch.value
        .trim()
        .toLowerCase();

    const sort = fileSort.value;

    const visible = getChildren(currentFolder)
        .filter(function(file) {
            return file.name
                .toLowerCase()
                .includes(search);
        });

    visible.sort(function(a, b) {
        if (sort === "type" && a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }

        return a.name.localeCompare(b.name);
    });

    return visible;
}

/* SHOW FILES */

function renderFiles() {
    fileList.replaceChildren();

    folderPathElement.value = getFolderPath();

    const visible = getVisibleFiles();

    visible.forEach(function(file) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "file-item";

        const icon = document.createElement("span");

        icon.textContent = file.type === "folder"
            ? "▣"
            : "▤";

        const name = document.createElement("small");

        name.textContent = file.name;

        button.append(icon, name);

        button.addEventListener("click", function() {
            if (file.type === "folder") {
                openFolder(file.id);
            } else {
                openTextFile(file.id);
            }
        });

        button.addEventListener(
            "contextmenu",
            function(event) {
                event.preventDefault();

                const action = prompt(
                    'Type "rename" or "delete" for ' +
                    file.name
                );

                if (!action) return;

                if (action.toLowerCase() === "rename") {
                    renameFile(file.id);
                }

                if (action.toLowerCase() === "delete") {
                    deleteFile(file.id);
                }
            }
        );

        fileList.appendChild(button);
    });

    if (visible.length === 0) {
        const message = document.createElement("p");

        message.textContent = "No files to display.";
        message.style.color = "#777";

        fileList.appendChild(message);
    }

    fileStatus.textContent =
        visible.length + " item(s)";
}

/* CREATE FOLDER OR FILE */

function createItem(type) {
    const entered = prompt(
        type === "folder"
            ? "New folder name:"
            : "New file name:"
    );

    if (entered === null) return;

    const name = entered.trim();

    if (!name) {
        showMessage("Please enter a name.");
        return;
    }

    if (fileNameExists(name, currentFolder)) {
        showMessage("An item with that name already exists.");
        return;
    }

    const item = {
        id: createId(),
        name: name,
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

    showMessage(name + " created");
}

getElement("newFolderButton")
    .addEventListener("click", function() {
        createItem("folder");
    });

getElement("newFileButton")
    .addEventListener("click", function() {
        createItem("file");
    });

/* RENAME FILES */

function renameFile(id) {
    const file = findFile(id);

    if (!file) return;

    const entered = prompt(
        "Rename:",
        file.name
    );

    if (entered === null) return;

    const name = entered.trim();

    if (!name) return;

    if (fileNameExists(name, file.parent, file.id)) {
        showMessage("That name already exists.");
        return;
    }

    const oldName = file.name;

    file.name = name;

    if (!saveFiles()) {
        file.name = oldName;
        return;
    }

    renderFiles();

    showMessage("Item renamed");
}

/* DELETE FILES AND FOLDERS */

function getDescendantIds(id) {
    const ids = new Set([id]);

    let changed = true;

    while (changed) {
        changed = false;

        files.forEach(function(file) {
            if (
                ids.has(file.parent) &&
                !ids.has(file.id)
            ) {
                ids.add(file.id);
                changed = true;
            }
        });
    }

    return ids;
}

function deleteFile(id) {
    const file = findFile(id);

    if (!file) return;

    const confirmed = confirm(
        "Delete " + file.name +
        " and its contents?"
    );

    if (!confirmed) return;

    const ids = getDescendantIds(id);

    const previous = files;

    files = files.filter(function(item) {
        return !ids.has(item.id);
    });

    if (!saveFiles()) {
        files = previous;
        return;
    }

    if (currentFileId && ids.has(currentFileId)) {
        currentFileId = null;
        savedEditorContent = "";
        minimizeApp("editor");
    }

    renderFiles();

    showMessage("Item deleted");
}

/* ========================================
   TEXT EDITOR
   ======================================== */

const fileEditor = getElement("fileEditor");
const editorTitle = getElement("editorTitle");
const editorStatus = getElement("editorStatus");

function hasUnsavedFile() {
    return (
        currentFileId !== null &&
        fileEditor.value !== savedEditorContent
    );
}

function openTextFile(id) {
    const file = findFile(id);

    if (!file || file.type !== "file") return;

    if (hasUnsavedFile()) {
        if (!confirm("Discard unsaved file changes?")) {
            return;
        }
    }

    currentFileId = id;

    editorTitle.textContent = file.name;

    fileEditor.value = file.content || "";

    savedEditorContent = fileEditor.value;

    editorStatus.textContent = "Ready";

    openApp("editor");
}

fileEditor.addEventListener("input", function() {
    editorStatus.textContent = "Unsaved changes";
});

function saveCurrentFile() {
    const file = findFile(currentFileId);

    if (!file) return;

    const previousContent = file.content;

    file.content = fileEditor.value;

    if (!saveFiles()) {
        file.content = previousContent;
        editorStatus.textContent = "Save failed";
        return;
    }

    savedEditorContent = fileEditor.value;

    editorStatus.textContent = "Saved";

    showMessage("File saved");
}

getElement("saveFileButton")
    .addEventListener("click", saveCurrentFile);

/* ========================================
   TERMINAL
   ======================================== */

const terminalOutput = getElement("terminalOutput");
const terminalInput = getElement("terminalInput");

function printTerminal(message) {
    terminalOutput.textContent += "\n" + message;

    terminalOutput.scrollTop =
        terminalOutput.scrollHeight;
}

function runCommand(input) {
    const commandLine = input.trim();

    if (!commandLine) return;

    printTerminal("NexusOS> " + commandLine);

    const space = commandLine.indexOf(" ");

    const command = (
        space === -1
            ? commandLine
            : commandLine.slice(0, space)
    ).toLowerCase();

    const argument = space === -1
        ? ""
        : commandLine.slice(space + 1).trim();

    switch (command) {
        case "help":
            printTerminal(
                "Commands:\n" +
                "help - Show commands\n" +
                "clear - Clear terminal\n" +
                "date - Current date\n" +
                "time - Current time\n" +
                "ls - List files\n" +
                "pwd - Current folder\n" +
                "echo - Print text\n" +
                "open - Open an app\n" +
                "version - System version"
            );
            break;

        case "clear":
            terminalOutput.textContent = "";
            break;

        case "date":
            printTerminal(new Date().toDateString());
            break;

        case "time":
            printTerminal(new Date().toLocaleTimeString());
            break;

        case "ls":
            const names = getChildren(currentFolder)
                .map(function(file) {
                    return file.name;
                });

            printTerminal(
                names.join("\n") || "(empty)"
            );
            break;

        case "pwd":
            printTerminal(getFolderPath());
            break;

        case "echo":
            printTerminal(argument);
            break;

        case "open":
            if (Object.hasOwn(appNames, argument)) {
                openApp(argument);
            } else {
                printTerminal("Unknown application");
            }
            break;

        case "version":
            printTerminal("NexusOS v1.1");
            break;

        default:
            printTerminal(
                "Unknown command: " + command
            );
    }
}

getElement("terminalForm")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        const input = terminalInput.value;

        terminalInput.value = "";

        runCommand(input);
    });

/* ========================================
   CALCULATOR
   ======================================== */

const calcDisplay = getElement("calcDisplay");

let calcValue = "0";
let storedNumber = null;
let pendingOperator = null;
let waitingForNumber = false;

function updateCalculator() {
    calcDisplay.value = calcValue;
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

function handleCalculator(action) {
    if (/^\d$/.test(action)) {
        if (
            waitingForNumber ||
            calcValue === "Error"
        ) {
            calcValue = action;
            waitingForNumber = false;
        } else {
            calcValue = calcValue === "0"
                ? action
                : calcValue + action;
        }

    } else if (action === "decimal") {
        if (waitingForNumber) {
            calcValue = "0.";
            waitingForNumber = false;
        } else if (!calcValue.includes(".")) {
            calcValue += ".";
        }

    } else if (action === "clear") {
        calcValue = "0";
        storedNumber = null;
        pendingOperator = null;
        waitingForNumber = false;

    } else if (action === "back") {
        calcValue = calcValue.length > 1
            ? calcValue.slice(0, -1)
            : "0";

    } else if (action === "sign") {
        calcValue = String(
            Number(calcValue) * -1
        );

    } else if (action === "percent") {
        calcValue = String(
            Number(calcValue) / 100
        );

    } else if (
        ["add", "subtract", "multiply", "divide"]
            .includes(action)
    ) {
        if (
            pendingOperator !== null &&
            !waitingForNumber
        ) {
            const result = calculate(
                storedNumber,
                Number(calcValue),
                pendingOperator
            );

            calcValue = Number.isFinite(result)
                ? String(result)
                : "Error";
        }

        storedNumber = Number(calcValue);

        pendingOperator = action;

        waitingForNumber = true;

    } else if (action === "equals") {
        if (
            pendingOperator !== null &&
            storedNumber !== null
        ) {
            const result = calculate(
                storedNumber,
                Number(calcValue),
                pendingOperator
            );

            calcValue = Number.isFinite(result)
                ? String(Number(result.toPrecision(12)))
                : "Error";

            storedNumber = null;
            pendingOperator = null;
            waitingForNumber = true;
        }
    }

    updateCalculator();
}

document.querySelectorAll("[data-calc]")
    .forEach(function(button) {
        button.addEventListener("click", function() {
            handleCalculator(button.dataset.calc);
        });
    });

/* ========================================
   FILE BACKUP SYSTEM
   ======================================== */

const backupFileInput = getElement("backupFileInput");

function exportBackup() {
    const backup = {
        application: "NexusOS",
        version: "1.1",
        exportedAt: new Date().toISOString(),
        files: files
    };

    const text = JSON.stringify(
        backup,
        null,
        2
    );

    const blob = new Blob(
        [text],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "nexusos-backup.json";

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}

getElement("exportFilesButton")
    .addEventListener("click", exportBackup);

getElement("importFilesButton")
    .addEventListener("click", function() {
        backupFileInput.click();
    });

/* CHECK BACKUP FORMAT */

function validBackup(backup) {
    if (!backup || !Array.isArray(backup.files)) {
        return false;
    }

    if (backup.files.length > 5000) {
        return false;
    }

    const ids = new Set();

    for (const file of backup.files) {
        if (!file || typeof file !== "object") {
            return false;
        }

        if (
            typeof file.id !== "string" ||
            typeof file.name !== "string" ||
            typeof file.parent !== "string" ||
            typeof file.content !== "string"
        ) {
            return false;
        }

        if (
            file.type !== "file" &&
            file.type !== "folder"
        ) {
            return false;
        }

        if (
            file.id === "root" ||
            !file.id ||
            !file.name.trim() ||
            ids.has(file.id)
        ) {
            return false;
        }

        ids.add(file.id);
    }

    const items = new Map(
        backup.files.map(file => [file.id, file])
    );

    for (const file of backup.files) {
        const visited = new Set([file.id]);

        let parent = file.parent;

        while (parent !== "root") {
            if (visited.has(parent)) return false;

            visited.add(parent);

            const folder = items.get(parent);

            if (!folder || folder.type !== "folder") {
                return false;
            }

            parent = folder.parent;
        }
    }

    return true;
}

/* IMPORT BACKUP FILE */

backupFileInput.addEventListener(
    "change",
    async function() {
        const selected = backupFileInput.files[0];

        if (!selected) return;

        try {
            if (selected.size > 5 * 1024 * 1024) {
                alert("Backup file is too large.");
                return;
            }

            const text = await selected.text();

            const backup = JSON.parse(text);

            if (!validBackup(backup)) {
                alert("Invalid NexusOS backup.");
                return;
            }

            const confirmed = confirm(
                "This will replace your current files. Continue?"
            );

            if (!confirmed) return;

            const previous = files;

            files = backup.files.map(function(file) {
                return { ...file };
            });

            if (!saveFiles()) {
                files = previous;
                return;
            }

            currentFolder = "root";
            currentFileId = null;
            savedEditorContent = "";

            minimizeApp("editor");

            fileSearch.value = "";

            renderFiles();

            showMessage("Backup restored");

        } catch (error) {
            console.error("Import failed:", error);

            alert("Could not read the backup.");
        } finally {
            backupFileInput.value = "";
        }
    }
);

/* ========================================
   START NEXUSOS
   ======================================== */

function initializeNexusOS() {
    renderFiles();
    updateTaskbar();
    updateClock();

    openApp("files");

    console.log("NexusOS v1.1 started.");
}

initializeNexusOS();
