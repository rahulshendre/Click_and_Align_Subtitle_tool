# Feature 1: Static Subtitles - Standalone Extension

This folder contains a complete, standalone Premiere Pro extension for Feature 1 (Static Subtitles).

## Files Structure

```
Feature1_StaticSubtitles/
├── CSInterface.js          # Adobe CEP interface library
├── CSXS/
│   └── manifest.xml         # Extension manifest (configures the extension)
├── jsx/
│   └── subtitles.jsx        # Main ExtendScript logic for static subtitles
├── index.html               # UI HTML (simplified for Feature 1 only)
├── main.js                  # JavaScript logic (simplified for Feature 1 only)
└── style.css                # Styling

```

## Features

- Load text files (.txt or .srt)
- Mark Start/End times for each subtitle line
- Add completed captions to track at any time (mid-session export)
- Reset subtitles
- Auto-creates caption track in Premiere Pro

## Installation

1. Copy this entire folder to your Premiere Pro extensions directory:
   - **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
   - **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/`

2. If needed, enable unsigned extensions (for development)

3. Restart Premiere Pro

4. Go to Window > Extensions > Subtitle Tool

## Usage

1. Click "Select Text File" to load your subtitle script
2. Use "Mark Start" to mark the start time of each subtitle
3. Use "Mark End" to mark the end time and move to next subtitle
4. Click "Add Completed Captions to Track" anytime to export completed subtitles
5. Continue marking more subtitles and add them again as needed

## Notes

- The extension uses Folder.temp for temporary SRT files (avoids permission errors)
- Supports UTF-16 and UTF-8 text file encoding
- Automatically creates caption tracks in Premiere Pro
