var subtitleLines = [];
var currentIndex = 0;
var subtitleMode = 'static';
var currentFileName = null; // Store current file name 

// =============================
// Utilities (encoding, logging)
// =============================

function logEvent(msg) {
    try {
        $.writeln('[StaticSubs] ' + msg);
        if (app && app.setSDKEventMessage) {
            app.setSDKEventMessage('[StaticSubs] ' + msg, 'info');
        }
    } catch (e) {
        // noop
    }
}

// =============================
// UTF-8 decoder (works for all languages; avoids host encoding issues)
// =============================

/**
 * Read file as raw bytes. In BINARY mode, each character's charCodeAt(i) is 0-255.
 * @param {File} file - Openable File object
 * @return {string|null} - Byte string or null on failure
 */
function readFileAsBinary(file) {
    var out = null;
    try {
        file.encoding = 'BINARY';
        if (file.open('r')) {
            out = file.read();
            file.close();
        }
    } catch (e) {
        logEvent('Binary read failed: ' + e);
        try { if (file && file.close) file.close(); } catch (_) {}
    }
    return out;
}

/**
 * Decode UTF-8 byte string to Unicode string. Handles BOM, multi-byte sequences,
 * and surrogate pairs for code points > 0xFFFF. Invalid sequences replaced with U+FFFD.
 * Supports all languages (Indic, Arabic, CJK, etc.).
 * @param {string} byteString - String where each charCodeAt(i) is a byte (0-255)
 * @return {string} - Decoded Unicode string
 */
function decodeUTF8(byteString) {
    if (!byteString || byteString.length === 0) return '';
    var len = byteString.length;
    var result = [];
    var i = 0;
    var REPLACEMENT = '\uFFFD';

    // Strip UTF-8 BOM if present
    if (len >= 3 && (byteString.charCodeAt(0) & 0xFF) === 0xEF &&
        (byteString.charCodeAt(1) & 0xFF) === 0xBB && (byteString.charCodeAt(2) & 0xFF) === 0xBF) {
        i = 3;
    }

    while (i < len) {
        var b0 = byteString.charCodeAt(i) & 0xFF;
        i += 1;

        if (b0 < 0x80) {
            result.push(String.fromCharCode(b0));
            continue;
        }
        if (b0 < 0xC2) {
            result.push(REPLACEMENT);
            continue;
        }
        if (b0 <= 0xDF) {
            if (i >= len) { result.push(REPLACEMENT); break; }
            var b1 = byteString.charCodeAt(i) & 0xFF;
            i += 1;
            if ((b1 & 0xC0) !== 0x80) { result.push(REPLACEMENT); continue; }
            var cp = ((b0 & 0x1F) << 6) | (b1 & 0x3F);
            result.push(String.fromCharCode(cp));
            continue;
        }
        if (b0 <= 0xEF) {
            if (i + 1 >= len) { result.push(REPLACEMENT); break; }
            var b1 = byteString.charCodeAt(i) & 0xFF;
            var b2 = byteString.charCodeAt(i + 1) & 0xFF;
            i += 2;
            if ((b1 & 0xC0) !== 0x80 || (b2 & 0xC0) !== 0x80) { result.push(REPLACEMENT); continue; }
            var cp = ((b0 & 0x0F) << 12) | ((b1 & 0x3F) << 6) | (b2 & 0x3F);
            if (cp < 0x800) { result.push(REPLACEMENT); continue; }
            if (cp >= 0xD800 && cp <= 0xDFFF) { result.push(REPLACEMENT); continue; }
            result.push(String.fromCharCode(cp));
            continue;
        }
        if (b0 <= 0xF4) {
            if (i + 2 >= len) { result.push(REPLACEMENT); break; }
            var b1 = byteString.charCodeAt(i) & 0xFF;
            var b2 = byteString.charCodeAt(i + 1) & 0xFF;
            var b3 = byteString.charCodeAt(i + 2) & 0xFF;
            i += 3;
            if ((b1 & 0xC0) !== 0x80 || (b2 & 0xC0) !== 0x80 || (b3 & 0xC0) !== 0x80) {
                result.push(REPLACEMENT);
                continue;
            }
            var cp = ((b0 & 0x07) << 18) | ((b1 & 0x3F) << 12) | ((b2 & 0x3F) << 6) | (b3 & 0x3F);
            if (cp < 0x10000 || cp > 0x10FFFF) { result.push(REPLACEMENT); continue; }
            cp -= 0x10000;
            result.push(String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)));
            continue;
        }
        result.push(REPLACEMENT);
    }
    return result.join('');
}

// --- UTF-16 support (commented out; tool uses UTF-8 only) ---
// Decode UTF-16 LE from raw bytes (no re-open, no host encoding). BOM (FF FE) skipped. Handles surrogate pairs.
/*
function decodeUTF16LE(byteString) {
    if (!byteString || byteString.length < 2) return '';
    var len = byteString.length;
    var result = [];
    var i = 2; // skip BOM (FF FE)
    var REPLACEMENT = '\uFFFD';
    while (i + 1 < len) {
        var lo = byteString.charCodeAt(i) & 0xFF;
        var hi = byteString.charCodeAt(i + 1) & 0xFF;
        var codeUnit = lo | (hi << 8);
        i += 2;
        if (codeUnit >= 0xD800 && codeUnit <= 0xDBFF && i + 1 < len) {
            var lo2 = byteString.charCodeAt(i) & 0xFF;
            var hi2 = byteString.charCodeAt(i + 1) & 0xFF;
            var low = lo2 | (hi2 << 8);
            if (low >= 0xDC00 && low <= 0xDFFF) {
                i += 2;
                result.push(String.fromCharCode(codeUnit, low));
            } else result.push(REPLACEMENT);
        } else if (codeUnit >= 0xDC00 && codeUnit <= 0xDFFF) result.push(REPLACEMENT);
        else result.push(String.fromCharCode(codeUnit));
    }
    return result.join('');
}

// Decode UTF-16 BE from raw bytes. BOM (FE FF) skipped. Handles surrogate pairs.
function decodeUTF16BE(byteString) {
    if (!byteString || byteString.length < 2) return '';
    var len = byteString.length;
    var result = [];
    var i = 2;
    var REPLACEMENT = '\uFFFD';
    while (i + 1 < len) {
        var hi = byteString.charCodeAt(i) & 0xFF;
        var lo = byteString.charCodeAt(i + 1) & 0xFF;
        var codeUnit = (hi << 8) | lo;
        i += 2;
        if (codeUnit >= 0xD800 && codeUnit <= 0xDBFF && i + 1 < len) {
            var hi2 = byteString.charCodeAt(i) & 0xFF;
            var lo2 = byteString.charCodeAt(i + 1) & 0xFF;
            var low = (hi2 << 8) | lo2;
            if (low >= 0xDC00 && low <= 0xDFFF) {
                i += 2;
                result.push(String.fromCharCode(codeUnit, low));
            } else result.push(REPLACEMENT);
        } else if (codeUnit >= 0xDC00 && codeUnit <= 0xDFFF) result.push(REPLACEMENT);
        else result.push(String.fromCharCode(codeUnit));
    }
    return result.join('');
}
*/

// Read text: UTF-8 only (decode from binary). UTF-16 path commented out.
function readTextFileTolerant(file) {
    // 1) Read entire file as binary
    var rawBytes = readFileAsBinary(file);
    if (!rawBytes || rawBytes.length === 0) return null;

    // 2) UTF-16 LE/BE disabled — treat all as UTF-8 (with or without BOM)
    // if (rawBytes.length >= 2) {
    //     var b0 = rawBytes.charCodeAt(0) & 0xFF;
    //     var b1 = rawBytes.charCodeAt(1) & 0xFF;
    //     if (b0 === 0xFF && b1 === 0xFE) {
    //         var content = decodeUTF16LE(rawBytes);
    //         if (content && content.length > 0) { logEvent('Read text as UTF-16 LE (decoded) successfully'); return content; }
    //     }
    //     if (b0 === 0xFE && b1 === 0xFF) {
    //         var content = decodeUTF16BE(rawBytes);
    //         if (content && content.length > 0) { logEvent('Read text as UTF-16 BE (decoded) successfully'); return content; }
    //     }
    // }

    // 3) Decode as UTF-8 (all languages supported)
    var content = decodeUTF8(rawBytes);
    if (content && content.length > 0) {
        logEvent('Read text as UTF-8 (decoded) successfully');
        return content;
    }

    return null;
}

function normalizeAndFilterLines(rawText) {
    if (!rawText) return [];
    // Normalize newlines
    var text = rawText.replace(/\r\n?|\n/g, '\n');
    var lines = text.split('\n');
    var out = [];
    for (var i = 0; i < lines.length; i++) {
        var line = (lines[i] || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        if (line && line.length > 0) {
            out.push(line);
        }
    }
    return out;
}

function setSubtitleMode(mode) {
    if (mode === 'static') {
        subtitleMode = mode;
        alert("Subtitle mode set to: " + mode);
    } else {
        alert("Invalid subtitle mode for static subtitles: " + mode);
    }
}

// SRT parsing utility
function parseSRT(srtText) {
    var lines = srtText.split(/\r?\n/);
    var entries = [];
    var i = 0;
    while (i < lines.length) {
        if (!lines[i] || !/^\d+$/.test(lines[i])) { i++; continue; }
        i++;
        var timeMatch = lines[i] && lines[i].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (!timeMatch) { i++; continue; }
        var start = {
            hours: parseInt(timeMatch[1]),
            minutes: parseInt(timeMatch[2]),
            seconds: parseInt(timeMatch[3]),
            milliseconds: parseInt(timeMatch[4])
        };
        var end = {
            hours: parseInt(timeMatch[5]),
            minutes: parseInt(timeMatch[6]),
            seconds: parseInt(timeMatch[7]),
            milliseconds: parseInt(timeMatch[8])
        };
        i++;
        var text = '';
        while (i < lines.length && lines[i] && lines[i].trim() !== '') {
            text += (text ? '\n' : '') + lines[i];
            i++;
        }
        entries.push({
            text: text,
            start: start,
            end: end
        });
        while (i < lines.length && lines[i].trim() === '') i++;
    }
    return entries;
}

function main() {
    subtitleLines = [];
    currentIndex = 0;
    if (!app.project) {
        alert("No active project found.");
        return;
    }
    var file = File.openDialog("Select your subtitle file", "*.txt;*.srt");
    if (!file) {
        alert("No file selected.");
        return;
    }
    currentFileName = file.name; // Store file name
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'srt') {
        var srtText = readTextFileTolerant(file);
        if (!srtText) {
            alert('Failed to read SRT file. Ensure it is readable.');
            return;
        }
        var subs = parseSRT(srtText);
        if (!subs.length) {
            alert("No valid subtitles found in SRT.");
            return;
        }
        subtitleLines = subs;
    } else {
        // TXT tolerant read (UTF-8), normalize
        var raw = readTextFileTolerant(file);
        if (!raw) {
            alert('Failed to read text file. Please save your file as UTF-8 (works for all languages).');
            return;
        }
        var lines = normalizeAndFilterLines(raw);
        for (var j = 0; j < lines.length; j++) {
            subtitleLines.push({ text: lines[j], start: null, end: null });
        }
        if (subtitleLines.length === 0) {
            alert("No valid lines found in the file.");
            return;
        }
    }
    currentIndex = 0;
    alert("Loaded " + subtitleLines.length + " subtitle lines. Ready to mark Start/End for static mode.");
    $.writeln("Loaded " + subtitleLines.length + " subtitle lines for static mode.");
    updateTextBoxWithCurrentSubtitle();
}

function markStart(mode) {
    if (!app.project || !app.project.activeSequence) {
        alert("No active sequence.");
        return;
    }
    if (currentIndex >= subtitleLines.length) {
        updateTextBoxWithCurrentSubtitle();
        return;
    }
    var time = app.project.activeSequence.getPlayerPosition();
    
    // Static mode: toggle start/end on repeated Start clicks
    if (subtitleLines[currentIndex].start === null) {
        // First click: mark start
        var subtitleText = subtitleLines[currentIndex].text;
        subtitleLines[currentIndex].start = time;
        insertSubtitleMarker(time, time, subtitleText);
        updateTextBoxWithCurrentSubtitle();
    } else if (subtitleLines[currentIndex].end === null) {
        // Second click: mark end for current, start next
        if (time.seconds <= subtitleLines[currentIndex].start.seconds) {
            alert("End time must be after Start time.");
            return;
        }
        subtitleLines[currentIndex].end = time;
        insertSubtitleMarker(subtitleLines[currentIndex].start, time, subtitleLines[currentIndex].text);
        currentIndex++;
        if (currentIndex < subtitleLines.length) {
            // Immediately start next subtitle at the same time
            var nextText = subtitleLines[currentIndex].text;
            subtitleLines[currentIndex].start = time;
            insertSubtitleMarker(time, time, nextText);
        }
        updateTextBoxWithCurrentSubtitle();
        saveSubtitleState();
        if (currentIndex >= subtitleLines.length) {
            autoCreateCaptionTrackFromSubtitles();
            return;
        }
    }
}

function toggleStartMark() {
    if (!app.project || !app.project.activeSequence) {
        alert("No active sequence.");
        return;
    }
    if (currentIndex >= subtitleLines.length) {
        updateTextBoxWithCurrentSubtitle();
        return;
    }
    var time = app.project.activeSequence.getPlayerPosition();
    
    if (subtitleLines[currentIndex].start === null) {
        // First click: mark start
        var subtitleText = subtitleLines[currentIndex].text;
        subtitleLines[currentIndex].start = time;
        insertSubtitleMarker(time, time, subtitleText);
        updateTextBoxWithCurrentSubtitle();
        $.writeln("Marked start for subtitle " + (currentIndex + 1) + ": " + subtitleText);
    } else if (subtitleLines[currentIndex].end === null) {
        // Second click: mark end for current, start next
        if (time.seconds <= subtitleLines[currentIndex].start.seconds) {
            alert("End time must be after Start time.");
            return;
        }
        subtitleLines[currentIndex].end = time;
        insertSubtitleMarker(subtitleLines[currentIndex].start, time, subtitleLines[currentIndex].text);
        $.writeln("Marked end for subtitle " + (currentIndex + 1) + ": " + subtitleLines[currentIndex].text);
        
        currentIndex++;
        if (currentIndex < subtitleLines.length) {
            // Immediately start next subtitle at the same time
            var nextText = subtitleLines[currentIndex].text;
            subtitleLines[currentIndex].start = time;
            insertSubtitleMarker(time, time, nextText);
            $.writeln("Started next subtitle " + (currentIndex + 1) + ": " + nextText);
        }
        updateTextBoxWithCurrentSubtitle();
        saveSubtitleState();
        
        if (currentIndex >= subtitleLines.length) {
            $.writeln("All subtitles marked. Creating caption track...");
            autoCreateCaptionTrackFromSubtitles();
            return;
        }
    }
}

function markEnd(mode) {
    if (!app.project || !app.project.activeSequence) {
        alert("No active sequence.");
        return;
    }
    if (currentIndex >= subtitleLines.length) {
        return;
    }
    if (subtitleLines[currentIndex].start === null) {
        alert("Please mark Start time first.");
        return;
    }
    var time = app.project.activeSequence.getPlayerPosition();
    if (time.seconds <= subtitleLines[currentIndex].start.seconds) {
        alert("End time must be after Start time.");
        return;
    }
    subtitleLines[currentIndex].end = time;
    insertSubtitleMarker(subtitleLines[currentIndex].start, subtitleLines[currentIndex].end, subtitleLines[currentIndex].text);
    currentIndex++;
    if (currentIndex >= subtitleLines.length) {
        autoCreateCaptionTrackFromSubtitles();
        return;
    }
    updateTextBoxWithCurrentSubtitle();
    saveSubtitleState();
}

function insertSubtitleMarker(startTime, endTime, text) {
    var seq = app.project.activeSequence;
    if (!seq) {
        alert("No active sequence.");
        return;
    }

    var marker = seq.markers.createMarker(startTime.seconds);
    marker.name = "Static Subtitle";
    marker.comments = text;
    marker.end = endTime.seconds;

    $.writeln("Static marker created from " + startTime.seconds + " to " + endTime.seconds + " with text: " + text);
}

function getCurrentSubtitle() {
    if (currentIndex >= subtitleLines.length) {
        return "";
    }
    return subtitleLines[currentIndex].text;
}

function getCurrentFileName() {
    return currentFileName || "";
}

function resetSubtitles() {
    subtitleLines = [];
    currentIndex = 0;
    currentFileName = null; // Reset file name
    
    if (app.project && app.project.activeSequence && app.project.activeSequence.markers) {
        var markers = app.project.activeSequence.markers;
        var marker = markers.getFirst();
        while (marker) {
            var nextMarker = markers.getNext();
            if (marker.name === "Static Subtitle") {
                markers.remove(marker);
            }
            marker = nextMarker;
        }
    }
    alert("Static subtitles and timeline markers have been reset.");
    $.writeln("Static subtitles and markers reset.");
    clearSubtitleState();
}

function updateTextBoxWithCurrentSubtitle() {
    if (typeof app === 'undefined' || typeof app.project === 'undefined') return;
    if (typeof subtitleLines === 'undefined' || currentIndex >= subtitleLines.length) {
        app.setTextBox && app.setTextBox("");
        return;
    }
    var text = subtitleLines[currentIndex].text || "";
    if (typeof app.setTextBox === 'function') {
        app.setTextBox(text);
    }
}


function pad(num, size) {
    var s = "000" + num;
    return s.substr(s.length - size);
}
function formatTime(t) {
    var totalMs = Math.floor(t.seconds * 1000);
    var ms = totalMs % 1000;
    var totalSec = Math.floor(totalMs / 1000);
    var s = totalSec % 60;
    var totalMin = Math.floor(totalSec / 60);
    var m = totalMin % 60;
    var h = Math.floor(totalMin / 60);
    return pad(h,2) + ":" + pad(m,2) + ":" + pad(s,2) + "," + pad(ms,3);
}

// NEW FUNCTION: Add completed captions to track at any time
function addCaptionsNow() {
    logEvent("addCaptionsNow called - adding completed captions to track");
    autoCreateCaptionTrackFromSubtitles();
}

function autoCreateCaptionTrackFromSubtitles() {
    try {
        if (subtitleLines.length === 0) {
            alert("No subtitles to export as captions.");
            return;
        }
        var srt = "";
        var idx = 1;
        for (var i = 0; i < subtitleLines.length; i++) {
            var line = subtitleLines[i];
            if (!line.start || !line.end) continue;
            srt += idx + "\n";
            srt += formatTime(line.start) + " --> " + formatTime(line.end) + "\n";
            srt += line.text + "\n\n";
            idx++;
        }
        
        if (!srt || idx === 1) {
            alert('No timed subtitles available to export.');
            return;
        }

        var uniqueName = "temp_subtitles_" + (new Date().getTime()) + ".srt";
        var tempFile = new File(Folder.temp.fsName + '/' + uniqueName);

        function writeSrtToFile(targetFile, content, useWindowsEOL, addUtf8BOM) {
            var finalText = content;
            if (useWindowsEOL) {
                // Normalize to CRLF for some Premiere importers
                finalText = finalText.replace(/\r?\n/g, "\r\n");
            } else {
                finalText = finalText.replace(/\r?\n/g, "\n");
            }
            if (addUtf8BOM) {
                // Prepend BOM (U+FEFF)
                finalText = "\uFEFF" + finalText;
            }
            targetFile.encoding = "UTF8"; // UTF-8
            targetFile.lineFeed = useWindowsEOL ? "Windows" : "Unix";
            if (!targetFile.open("w")) {
                return false;
            }
            targetFile.write(finalText);
            targetFile.close();
            return true;
        }

        // Attempt 1: UTF-8 (no BOM), LF
        var wrote = writeSrtToFile(tempFile, srt, /*useWindowsEOL*/false, /*addUtf8BOM*/false);
        if (!wrote) {
            alert("Failed to open temp SRT file for writing.");
            return;
        }
        logEvent("Temp SRT (UTF-8 LF, no BOM) exported: " + tempFile.fsName);
        
        var seq = app.project.activeSequence;
        if (!seq) {
            alert("No active sequence. Cannot import captions.");
            return;
        }
        var destBin = app.project.getInsertionBin ? app.project.getInsertionBin() : app.project.rootItem;
        if (!destBin) {
            alert('No valid destination bin found for import.');
            return;
        }

        var beforeCount = destBin && destBin.children ? destBin.children.numItems : 0;
        var importThese = [tempFile.fsName];
        var importOk = app.project.importFiles(importThese, true, destBin, false);
        logEvent('Import invoked (attempt 1): ' + importOk);

        // Verify import by checking children count
        var afterCount = destBin && destBin.children ? destBin.children.numItems : 0;

        // If first attempt didn't increase items, retry with CRLF + BOM which some builds prefer
        if (afterCount <= beforeCount) {
            logEvent('Import attempt 1 did not increase bin count. Retrying with CRLF + UTF-8 BOM...');
            // Overwrite file with CRLF + BOM
            writeSrtToFile(tempFile, srt, /*useWindowsEOL*/true, /*addUtf8BOM*/true);
            beforeCount = destBin.children.numItems;
            importOk = app.project.importFiles([tempFile.fsName], true, destBin, false);
            logEvent('Import invoked (attempt 2): ' + importOk);
            afterCount = destBin.children.numItems;
            if (afterCount <= beforeCount) {
                alert('SRT import failed. Please check that your Premiere build supports SRT import; a CRLF + UTF-8 BOM variant also failed. File: ' + tempFile.fsName);
                return;
            }
        }
        var importedSRT = destBin.children[afterCount - 1];
        if (!importedSRT) {
            alert('Imported SRT not found in bin after import.');
            return;
        }

        var result = seq.createCaptionTrack(importedSRT, 0);
        if (result) {
            alert("Successfully created caption track from SRT!");
            logEvent('Caption track creation succeeded.');
        } else {
            alert("Failed to create caption track from imported SRT.");
            logEvent('Caption track creation failed.');
        }
    } catch (e) {
        alert("Error auto-creating caption track: " + e);
        logEvent('Exception during caption creation: ' + e);
    }
}



function saveSubtitleState() {
    var state = {
        subtitleLines: subtitleLines,
        currentIndex: currentIndex,
        mode: 'static'
    };
    var file = new File(Folder.userData.fsName + "/static_subtitle_tool_state.json");
    file.encoding = "UTF-8";
    if (file.open("w")) {
        file.write(JSON.stringify(state));
        file.close();
    }
}

function loadSubtitleState() {
    var file = new File(Folder.userData.fsName + "/static_subtitle_tool_state.json");
    if (file.exists) {
        file.encoding = "UTF-8";
        if (file.open("r")) {
            var state = JSON.parse(file.read());
            file.close();
            subtitleLines = state.subtitleLines || [];
            currentIndex = state.currentIndex || 0;
            updateTextBoxWithCurrentSubtitle();
        }
    }
}

function clearSubtitleState() {
    var file = new File(Folder.userData.fsName + "/static_subtitle_tool_state.json");
    if (file.exists) file.remove();
}