# 🎶 Interactive 3D Melody Generator

This project is a browser-based interactive musical experience. Users drop spheres into a 3D scene where collisions with obstacles generate musical notes. The environment is fully interactive: obstacles can be moved, rotated, and resized, allowing for custom musical setups.

##  Features

- Real-time 3D graphics using **Babylon.js**
- Physics simulation powered by **Havok Physics**
- Sound synthesis using **Web Audio Modules (Pro-54 synth)**
- Customizable musical scale and arpeggiator
- Interactive obstacle manipulation
- No installation required – runs in the browser

##  How It Works

- Each sphere is a physics-enabled object.
- When a sphere collides with a platform, a MIDI note is triggered.
- Notes are taken from an arpeggiated musical scale.
- The synthesizer used is a WAM Pro-54, controlled via JavaScript.

## 🔧 Setup Instructions

1. Open the project folder in **VS Code**.
2. Install the **Live Server** extension.
3. Right-click on `index2.html` and select **"Open with Live Server"**.
4. The app will open automatically in your default browser.


## 🎮 Controls

- **Click**: Drop a new ball
- **N**: Add a new obstacle
- **Delete / Backspace**: Remove selected obstacle
- **Mouse Drag**: Move selected obstacle
- **Shift + Drag**: Rotate obstacle
- **Ctrl + Drag**: Resize obstacle

## 🎼 Sound Logic

- A musical scale is created using the `Scales` class in `scales.js`
- An arpeggiator defines the playback pattern (forward, reverse, alternate, random)
- Each collision triggers a MIDI note from the current arpeggio
- The Pro-54 synth plays the notes using the Web Audio Modules API
