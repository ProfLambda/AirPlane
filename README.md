# 3D Airplane Game

Welcome to the 3D Airplane Game! This is a simple flight simulator built with Three.js.

## How to Play

The game starts with your plane on the ground. You need to gain enough speed to take off and then control the plane in the air.

### Controls

- **Z**: Accelerate (engine on)
- **S**: Brake
- **Q**: Turn left (on the ground) / Roll left (in the air)
- **D**: Turn right (on the ground) / Roll right (in the air)
- **Arrow Up**: Pitch nose down
- **Arrow Down**: Pitch nose up (pull up)

### Takeoff

1.  Press and hold the **Z** key to accelerate.
2.  Once your speed is high enough (the takeoff speed), press the **Arrow Down** key to lift off the ground.

### Flight

- Use the **Arrow Up** and **Arrow Down** keys to control your altitude.
- Use **Q** and **D** to roll the plane, which will cause it to turn.

### Fuel

- Your plane consumes fuel when the engine is running (when you press **Z**).
- If you run out of fuel, the engine will shut off.
- You can enable the **Solar Engine** checkbox for unlimited fuel.

### Crashing

- If you hit the ground at a steep angle or with too much vertical speed, you will crash.
- Crashing will reset the game, and you will start over.

## Running the Game

1.  You need a local web server to run this game due to browser security policies for loading files (like the 3D model).
2.  If you have Python installed, you can run a simple server:
    -   Python 2: `python -m SimpleHTTPServer`
    -   Python 3: `python -m http.server`
3.  Once the server is running, open your web browser and go to `http://localhost:8000` (or the port specified by your server).