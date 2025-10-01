# 3D Airplane Game

This is a simple 3D airplane game built with Three.js.

## How to Play

The goal is to fly the airplane without crashing or running out of fuel.

### Controls

**On the Ground:**

*   **`Z`**: Accelerate
*   **`S`**: Brake
*   **`Q`**: Turn Left
*   **`D`**: Turn Right

**In the Air:**

*   **`Z`**: Increase Thrust
*   **`S`**: Decrease Thrust
*   **`ArrowUp`**: Pitch Down (to climb)
*   **`ArrowDown`**: Pitch Up (to dive)
*   **`Q`**: Roll Left
*   **`D`**: Roll Right

### Game Mechanics

*   **Takeoff**: You need to reach a certain speed on the ground before you can take off.
*   **Fuel**: Your plane consumes fuel over time. The game restarts if you run out. You can enable the "Solar Engine" option for unlimited fuel.
*   **Crashing**: If you hit the ground with a steep angle, your plane will explode, and the game will restart.
*   **Landing**: To land safely, approach the ground at a low speed and a shallow angle.

## How to Run

Simply open the `index.html` file in a modern web browser. No server is required.