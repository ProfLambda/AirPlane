# Project Roadmap

This document outlines the development progress of the 3D Airplane Game.

## Completed Features

- [x] **Project Restructuring**: Archived old files and set up a clean project structure.
- [x] **Basic Scene Setup**: Initialized a Three.js scene with a sky background, lighting, and a ground plane.
- [x] **Plane Model Integration**: Loaded the `aviao_low_poly.glb` 3D model into the scene.
- [x] **Camera System**: Implemented a smooth, third-person follow camera.
- [x] **Control System**: Set up keyboard controls for ground movement (`zqsd`) and flight (`arrow keys`).
- [x] **Physics Engine**:
    - [x] Ground movement: acceleration, braking, and turning.
    - [x] Flight dynamics: takeoff, pitching, rolling, and lift.
    - [x] Crash detection and game reset.
- [x] **Fuel System**:
    - [x] Fuel consumption tied to engine usage.
    - [x] 'Solar engine' option for unlimited fuel.
- [x] **UI Display**: Created on-screen display for speed, altitude, and fuel.
- [x] **Propeller Animation**: Synced the propeller animation with the engine's power.
- [x] **Documentation**: Updated `README.md` with game instructions and created this `roadmap.md`.

## Future Goals

- [ ] Add more environmental details (e.g., clouds, mountains).
- [ ] Implement sound effects for the engine, crash, etc.
- [ ] Create more complex missions or objectives.
- [ ] Refine flight physics for a more realistic feel.