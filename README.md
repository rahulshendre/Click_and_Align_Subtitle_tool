# Click and Align Subtitle Tool

A Premiere Pro extension for creating and aligning static subtitles with an intuitive click-to-mark workflow.

## Overview

This extension simplifies the process of adding subtitles to your Premiere Pro projects. Load your subtitle text file, mark start and end times by clicking buttons while playing your video, and automatically generate caption tracks in Premiere Pro.

## Features

- **Load Text Files**: Support for both `.txt` and `.srt` file formats
- **Flexible Encoding**: Automatically handles UTF-16 and UTF-8 text file encoding
- **Click-to-Mark Workflow**: 
  - Mark start time for each subtitle
  - Mark end time to complete a subtitle and move to the next
- **Mid-Session Export**: Add completed captions to the track at any time during your session
- **Incremental Workflow**: Continue marking more subtitles and add them again as needed
- **Auto-Caption Track Creation**: Automatically creates caption tracks in Premiere Pro
- **Timeline Markers**: Creates visual markers on the timeline for each subtitle
- **State Persistence**: Saves your progress automatically

## File Structure

```
ClickAndAlignSubtitleTool/
├── CSInterface.js          # Adobe CEP interface library
├── CSXS/
│   └── manifest.xml         # Extension manifest (configures the extension)
├── jsx/
│   └── subtitles.jsx        # Main ExtendScript logic for subtitle processing
├── index.html               # UI HTML interface
├── main.js                  # JavaScript logic and event handlers
├── style.css                # Styling and UI design
├── bird_logo.png            # Brand logo (left)
├── planetread_logo.png      # Brand logo (right)
└── README.md                # This file
```

## Requirements

- **Adobe Premiere Pro**: Version 25.0 to 25.9
- **CEP Runtime**: Version 12.0 or higher
- **Operating System**: Windows or macOS

## Installation

### Step 1: Locate Extensions Directory

- **Windows**: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
- **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/`

### Step 2: Copy Extension Folder

Copy the entire `ClickAndAlignSubtitleTool` folder to the extensions directory.

### Step 3: Enable Unsigned Extensions (Development Only)

For development/testing purposes, you may need to enable unsigned extensions:

**Windows:**
1. Create or edit the registry key: `HKEY_CURRENT_USER\Software\Adobe\CSXS.12`
2. Add a String value: `PlayerDebugMode` = `1`

**macOS:**
1. Open Terminal
2. Run: `defaults write com.adobe.CSXS.12 PlayerDebugMode 1`

### Step 4: Restart Premiere Pro

Close and restart Adobe Premiere Pro to load the extension.

### Step 5: Access the Extension

Go to **Window > Extensions > Click and Align Subtitle Tool**

## Usage

### Basic Workflow

1. **Load Your Subtitle File**
   - Click "Select Text File" button
   - Choose a `.txt` or `.srt` file
   - The first subtitle line will appear in the text area

2. **Mark Start Time**
   - Play your video in Premiere Pro
   - When you reach the point where the subtitle should start, click "Mark Start"
   - A timeline marker will be created

3. **Mark End Time**
   - Continue playing the video
   - When the subtitle should end, click "Mark End"
   - The current subtitle is completed and the next subtitle line appears

4. **Add Captions to Track**
   - At any point during your session, click "Add Completed Captions to Track"
   - This exports all completed (marked) subtitles to a caption track
   - You can continue marking more subtitles and add them again

5. **Reset (Optional)**
   - Click "Reset Subtitles" to clear all progress and start over

### File Format Support

**Text Files (.txt):**
- One subtitle per line
- Supports UTF-8 and UTF-16 encoding
- Empty lines are automatically filtered out

**SRT Files (.srt):**
- Standard SubRip subtitle format
- If your SRT file already contains timing information, it will be loaded but you can still re-mark the times

### Tips

- You can mark multiple subtitles before exporting them all at once
- The extension automatically saves your progress
- Timeline markers help you visualize subtitle placement
- The extension uses temporary files in the system temp folder to avoid permission issues

## Technical Details

### Extension Configuration

- **Bundle ID**: `com.subtitle.tool`
- **Version**: 1.0.0
- **Panel Size**: 400x800 pixels
- **Auto-Visible**: Yes

### State Management

The extension automatically saves your subtitle state to:
- **Location**: User data folder
- **File**: `static_subtitle_tool_state.json`
- **Format**: JSON

### Temporary Files

SRT files for caption import are created in the system temporary folder to avoid file permission issues.

## Troubleshooting

### Extension Not Appearing

1. Verify the extension is in the correct directory
2. Check that unsigned extensions are enabled (for development)
3. Restart Premiere Pro
4. Check the ExtendScript Toolkit console for errors

### File Loading Issues

- Ensure your text file is saved as UTF-8 or UTF-16
- Check that the file is not corrupted
- Verify file permissions allow reading

### Caption Track Not Created

- Ensure you have an active sequence in Premiere Pro
- Verify that at least one subtitle has both start and end times marked
- Check that Premiere Pro supports SRT import (version 25.0+)

### Timeline Markers Not Appearing

- Ensure you have an active sequence selected
- Check that the playhead position is valid
- Verify sequence is not locked

## Development

### ExtendScript Functions

The main ExtendScript functions available in `subtitles.jsx`:

- `main()` - Load subtitle file
- `toggleStartMark()` - Mark start time
- `markEnd(mode)` - Mark end time
- `addCaptionsNow()` - Export completed captions
- `resetSubtitles()` - Reset all progress
- `getCurrentSubtitle()` - Get current subtitle text
- `getCurrentFileName()` - Get loaded file name

### JavaScript Interface

The `main.js` file handles:
- CSInterface initialization
- Event listeners for UI buttons
- Communication between HTML UI and ExtendScript
- Error handling and logging

## License

[Add your license information here]

## Support

[Add support contact information here]

## Version History

### 1.0.0
- Initial release
- Static subtitle marking workflow
- Support for TXT and SRT file formats
- Auto-caption track creation
- Timeline marker integration
