// Initialize CSInterface with proper error handling
var csInterface = null;

try {
    if (typeof CSInterface !== 'undefined') {
        csInterface = new CSInterface();
        console.log("CSInterface initialized successfully");
    } else {
        console.log("CSInterface not available - running in test mode");
    }
} catch (error) {
    console.log("Error initializing CSInterface: " + error);
    console.log("Running in test mode without Adobe integration");
}

// Helper function to safely call evalScript
function safeEvalScript(script, callback) {
    console.log("=== safeEvalScript called ===");
    console.log("Script to execute: " + script);
    console.log("CSInterface object: " + csInterface);
    console.log("CSInterface type: " + typeof csInterface);
    
    if (csInterface && typeof csInterface.evalScript === 'function') {
        console.log("CSInterface.evalScript is available, calling it...");
        try {
            csInterface.evalScript(script, callback);
            console.log("evalScript call completed successfully");
        } catch (error) {
            console.log("ERROR calling evalScript: " + error);
            if (callback) callback(null);
        }
    } else {
        console.log("CSInterface not available or evalScript not a function");
        console.log("CSInterface: " + csInterface);
        console.log("evalScript method: " + (csInterface ? typeof csInterface.evalScript : "N/A"));
        if (callback) callback(null);
    }
}

// Helper function to safely get system path
function safeGetSystemPath(pathType) {
    if (csInterface && typeof csInterface.getSystemPath === 'function') {
        try {
            return csInterface.getSystemPath(pathType);
        } catch (error) {
            console.log("Error getting system path: " + error);
            return null;
        }
    } else {
        console.log("CSInterface not available - cannot get system path");
        return null;
    }
}

// Track if script is loaded
var staticScriptLoaded = false;

// Load the static subtitle script
function loadStaticScript() {
    console.log("=== loadStaticScript called ===");
    console.log("CSInterface available: " + (csInterface ? "YES" : "NO"));
    
    try {
        if (!staticScriptLoaded) {
            console.log("Loading static script...");
            // Only try to load if CSInterface is available
            var extensionPath = safeGetSystemPath(SystemPath.EXTENSION);
            console.log("Extension path: " + extensionPath);
            if (extensionPath) {
                var scriptPath = extensionPath + '/jsx/subtitles.jsx';
                console.log("Loading script: " + scriptPath);
                safeEvalScript('$.evalFile("' + scriptPath + '")');
            } else {
                console.log("ERROR: Could not get extension path");
            }
            staticScriptLoaded = true;
            console.log("Static script loaded flag set to true");
        } else {
            console.log("Static script already loaded");
        }
    } catch (error) {
        console.log("ERROR loading static script: " + error);
    }
}

// =============================
// Word spacing controls (UI + host sync)
// =============================

var wordSpacingSlider = document.getElementById('wordSpacingSlider');
var wordSpacingInput = document.getElementById('wordSpacing');
var wordSpacingUp = document.getElementById('wordSpacingUp');
var wordSpacingDown = document.getElementById('wordSpacingDown');

function normalizeWordSpacing(value) {
    var spacing = parseFloat(value);
    if (isNaN(spacing) || spacing < 1) {
        spacing = 1;
    }
    if (spacing > 15) {
        spacing = 15;
    }
    return spacing;
}

function updateWordSpacing(spacing) {
    var normalized = normalizeWordSpacing(spacing);

    if (wordSpacingInput) {
        wordSpacingInput.value = normalized.toFixed(1);
    }
    if (wordSpacingSlider) {
        wordSpacingSlider.value = normalized;
    }

    // Ensure JSX is loaded, then update spacing in host
    loadStaticScript();
    if (typeof csInterface !== 'undefined' && csInterface && csInterface.evalScript) {
        csInterface.evalScript("setWordSpacing(" + normalized + ")");
    }
}

if (wordSpacingSlider && wordSpacingInput) {
    wordSpacingSlider.oninput = function() {
        updateWordSpacing(wordSpacingSlider.value);
    };
    
    wordSpacingInput.oninput = function() {
        updateWordSpacing(wordSpacingInput.value);
    };
}

if (wordSpacingUp && wordSpacingInput) {
    wordSpacingUp.onclick = function() {
        var currentValue = parseFloat(wordSpacingInput.value) || 1;
        var step = parseFloat(wordSpacingInput.step) || 0.1;
        var max = parseFloat(wordSpacingInput.max) || 15;
        var newValue = Math.min(currentValue + step, max);
        updateWordSpacing(newValue);
    };
}

if (wordSpacingDown && wordSpacingInput) {
    wordSpacingDown.onclick = function() {
        var currentValue = parseFloat(wordSpacingInput.value) || 1;
        var step = parseFloat(wordSpacingInput.step) || 0.1;
        var min = parseFloat(wordSpacingInput.min) || 0;
        var newValue = Math.max(currentValue - step, min);
        updateWordSpacing(newValue);
    };
}

// Set Text button event listener (Feature 1)
var setTextElement = document.getElementById("setText");
if (setTextElement) {
    setTextElement.addEventListener("click", function () {
        console.log("=== setText button clicked (Feature 1) ===");
        console.log("CSInterface available: " + (csInterface ? "YES" : "NO"));
        
        console.log("Loading script for static mode...");
        loadStaticScript();
        console.log("Calling main()...");
        safeEvalScript("main()", function (result) {
            console.log("main() callback received: " + result);
            updateTextBox(0);  // Show first subtitle line
            console.log("Static mode main() called");
            
            // Update file status to show just the file name
            loadStaticScript();
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("getCurrentFileName()", function (fileName) {
                    var textFileStatusElement = document.getElementById("textFileStatus");
                    if (textFileStatusElement) {
                        if (fileName && fileName.length > 0) {
                            textFileStatusElement.textContent = fileName;
                            textFileStatusElement.classList.add("file-selected");
                        } else {
                            textFileStatusElement.textContent = "No file chosen";
                            textFileStatusElement.classList.remove("file-selected");
                        }
                    }
                });
            }
        });
    });
} else {
    console.log("ERROR: setText element not found");
}

// Feature 1: Static Subtitles event listeners
var startTextElement = document.getElementById("startText");
if (startTextElement) {
    startTextElement.addEventListener("click", function () {
        console.log("startText button clicked");
        loadStaticScript();
        if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
            csInterface.evalScript("toggleStartMark()", function (result) {
                if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                    csInterface.evalScript("getCurrentSubtitle()", function (subtitleText) {
                        updateTextBox(subtitleText);
                        console.log("Updated text box with: " + subtitleText);
                    });
                }
            });
        }
    });
}

var endTextElement = document.getElementById("endText");
if (endTextElement) {
    endTextElement.addEventListener("click", function () {
        console.log("endText button clicked");
        loadStaticScript();
        if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
            csInterface.evalScript("markEnd('static')", function (result) {
                if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                    csInterface.evalScript("getCurrentSubtitle()", function (subtitleText) {
                        updateTextBox(subtitleText);
                        console.log("Updated text box with: " + subtitleText);
                    });
                }
            });
        }
    });
}

// Add Captions Now button event listener
var addCaptionsNowElement = document.getElementById("addCaptionsNow");
if (addCaptionsNowElement) {
    addCaptionsNowElement.addEventListener("click", function () {
        console.log("addCaptionsNow button clicked");
        loadStaticScript();
        // Ensure latest word spacing is synced before exporting captions
        if (wordSpacingInput) {
            updateWordSpacing(wordSpacingInput.value);
        }
        if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
            csInterface.evalScript("addCaptionsNow()", function (result) {
                console.log("addCaptionsNow result: " + result);
            });
        }
    });
}

// Reset button event listener
var resetElement = document.getElementById("reset");
if (resetElement) {
    resetElement.addEventListener("click", function () {
        console.log("reset button clicked");
        loadStaticScript();
        if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
            csInterface.evalScript("resetSubtitles()");
        }
        
        // Reset file status
        var textFileStatusElement = document.getElementById("textFileStatus");
        if (textFileStatusElement) {
            textFileStatusElement.textContent = "No file chosen";
            textFileStatusElement.classList.remove("file-selected");
        }
        
        // Clear text area
        updateTextBox("");
        
        // Reset file name in JSX
        if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
            csInterface.evalScript("currentFileName = null");
        }
    });
}

function updateTextBox(subtitleText) {
    var subtitleTextElement = document.getElementById("subtitleText");
    if (subtitleTextElement) {
        subtitleTextElement.value = subtitleText || "";
    }
}

window.setTextBox = function(text) {
    document.getElementById("subtitleText").value = text;
};

// Tool status monitoring
var toolStatusInterval = null;
var isToolActive = false;
var hasWindowFocus = true;

// Track window focus - when timeline is focused, extension panel loses focus
window.addEventListener('blur', function() {
    hasWindowFocus = false;
    updateToolStatus(false);
});

window.addEventListener('focus', function() {
    hasWindowFocus = true;
    checkToolStatus(); // Re-check status when panel regains focus
});

// Track panel visibility - re-check when panel becomes visible/hidden
document.addEventListener('visibilitychange', function() {
    checkToolStatus(); // Re-check status when visibility changes
});

function checkToolStatus() {
    if (!csInterface || typeof csInterface.evalScript !== 'function') {
        updateToolStatus(false);
        return;
    }
    
    // Check panel visibility
    var isPanelVisible = document.visibilityState === 'visible';
    
    // Check both sequence availability AND window focus AND panel visibility
    safeEvalScript("app.project && app.project.activeSequence ? 'active' : 'inactive'", function(result) {
        // Handle script execution failures
        if (result === null || result === undefined) {
            updateToolStatus(false);
            return;
        }
        
        var hasSequence = result === 'active';
        var active = hasSequence && hasWindowFocus && isPanelVisible;
        updateToolStatus(active);
    });
}

function updateToolStatus(active) {
    var container = document.querySelector('.container');
    if (!container) return;
    
    if (active !== isToolActive) {
        isToolActive = active;
        if (active) {
            container.classList.remove('tool-inactive');
            container.classList.add('tool-active');
        } else {
            container.classList.remove('tool-active');
            container.classList.add('tool-inactive');
        }
    }
}

// Initialize the UI on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing UI...");
    
    // Load static script on initialization
    loadStaticScript();
    
<<<<<<< HEAD
=======
    // Initialize default word spacing in host
    if (wordSpacingInput) {
        updateWordSpacing(wordSpacingInput.value);
    }
    
>>>>>>> click_and_align_subtitle_tool
    // Start status monitoring
    checkToolStatus();
    toolStatusInterval = setInterval(checkToolStatus, 1000); // Check every second
    
    console.log("UI initialization complete");
});

// Global error handler
window.addEventListener('error', function(event) {
    console.log("Global error caught:", event.error);
    console.log("Error message:", event.message);
    console.log("Error filename:", event.filename);
    console.log("Error line number:", event.lineno);
});

