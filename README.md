# NEON VANGUARD // 3D Cyber-Arena

A fast-paced, modular 3D Cyber-Neon Arena Combat & Obstacle Runner built with **Three.js** and procedural **Web Audio API** sound synthesis.

## Features
- **Modular ES6 Architecture**: Clean separation across rendering, audio, input, AI entities, projectiles, particles, and HUD radar.
- **Hybrid Combat & Obstacle Runner Mechanics**: Leap over rotating low-altitude plasma sweepers, use cover pillars, and execute invulnerable Phase Dashes.
- **Wave Scaling & Enemy Archetypes**: Face fast melee **Stalkers**, ranged strafing **Artillery** drones, and armored **Juggernauts**.
- **Weapon Progression**: Upgrade from a single **Pulse Rifle** to a **Twin Blaster** and **Triple Scatter** cannon.
- **Cross-Platform Input**: Full desktop (`WASD` + Mouse Raycast Aim + Camera Orbit) and mobile touch support (Virtual Joystick + Auto-Target Assist).

## Controls
| Action | Desktop | Mobile |
| :--- | :--- | :--- |
| **Move** | `W A S D` / `Arrow Keys` | Left Virtual Joystick |
| **Aim** | Mouse Cursor | Automatic Nearest-Target Lock |
| **Fire** | Left Click (Hold) | `FIRE` Button |
| **Jump Lasers** | `Space` | `JUMP` Button |
| **Phase Dash** | `Shift` | `DASH` Button |
| **Orbit Camera** | Right Click + Drag | — |

## Running Locally
Because the project uses native ES6 `<script type="module">` imports, serve the root directory over HTTP:

```bash
# Using Node.js
npx serve .

# Or using Python 3
python3 -m http.server 8080
