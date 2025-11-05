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
                            textFileStatusElement.textContent = "No file selected";
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
            textFileStatusElement.textContent = "No file selected";
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

// Initialize the UI on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing UI...");
    
    // Load static script on initialization
    loadStaticScript();
    
    console.log("UI initialization complete");
});

// Global error handler
window.addEventListener('error', function(event) {
    console.log("Global error caught:", event.error);
    console.log("Error message:", event.message);
    console.log("Error filename:", event.filename);
    console.log("Error line number:", event.lineno);
});

