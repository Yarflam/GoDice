# GoDice JavaScript API Documentation

This document describes the low-level JavaScript API provided by `godice.js` for communicating with GoDice devices over Bluetooth Low Energy (BLE).

## Getting Started

1. Include the API file in your HTML:
   ```html
   <script src="godice.js"></script>
   ```

2. Create a new instance of the `GoDice` class:
   ```javascript
   const goDice = new GoDice();
   ```

3. Open the Bluetooth connection dialog:
   ```javascript
   goDice.requestDevice();
   ```

4. After a successful connection, the `onDiceConnected` callback will be triggered.

---

## API Reference

### Message Functions

#### `setLed(led1, led2)`
Turn ON/OFF the RGB LEDs. LEDs turn off if both `led1` and `led2` are `null` or `[0, 0, 0]`.

- `led1` — Array `[R, G, B]` where each value is 0-255
- `led2` — Array `[R, G, B]` where each value is 0-255

```javascript
goDice.setLed([255, 0, 0], [255, 0, 0]); // Red on both LEDs
goDice.setLed([0], [0]);                  // Turn off
```

#### `pulseLed(pulseCount, onTime, offTime, RGB)`
Pulse the LEDs for a defined time and color.

- `pulseCount` — How many times to repeat (max 255)
- `onTime` — LED ON duration per pulse, in units of 10ms (max 255)
- `offTime` — LED OFF duration per pulse, in units of 10ms (max 255)
- `RGB` — Array `[R, G, B]` where each value is 0-255

```javascript
goDice.pulseLed(10, 20, 20, [0, 0, 255]); // 10 blue pulses, 200ms on / 200ms off
```

---

### Request Functions

#### `requestDevice()`
Opens the browser Bluetooth connection dialog. After a successful connection, `onDiceConnected` is called.

```javascript
// Using async/await
async function connect() {
    const die = new GoDice();
    try {
        await die.requestDevice();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}
```

#### `getDiceColor()`
Request the physical color of the die (dot color). Response arrives via `onDiceColor`.

```javascript
goDice.getDiceColor();
```

#### `getBatteryLevel()`
Request the battery level. Response arrives via `onBatteryLevel`.

```javascript
goDice.getBatteryLevel();
```

#### `setDieType(diceType)`
Set the die type / shell for value calculations. Use `GoDice.diceTypes.*`.

Supported types: `D6`, `D20`, `D10`, `D10X`, `D4`, `D8`, `D12`.
Default is `D6`.

```javascript
goDice.setDieType(GoDice.diceTypes.D20);
```

#### `attemptReconnect()`
Attempts to reconnect to the die's Bluetooth device. If successful, `onDiceConnected` is called.

```javascript
goDice.attemptReconnect();
```

---

### Response Callbacks

Override these prototype functions to receive events from the die.

#### `onDiceConnected(diceId, diceInstance)`
Called when a die successfully connects.

```javascript
GoDice.prototype.onDiceConnected = (diceId, diceInstance) => {
    console.log("Connected:", diceId);
};
```

#### `onDiceDisconnected(diceId, diceInstance)`
Called when a die disconnects.

```javascript
GoDice.prototype.onDiceDisconnected = (diceId, diceInstance) => {
    console.log("Disconnected:", diceId);
};
```

#### `onBatteryLevel(diceId, batteryLevel)`
Called in response to `getBatteryLevel()`.

```javascript
GoDice.prototype.onBatteryLevel = (diceId, batteryLevel) => {
    console.log("Battery:", diceId, batteryLevel + "%");
};
```

#### `onDiceColor(diceId, color)`
Called in response to `getDiceColor()`. The `color` parameter is an index:

| Index | Color  |
|-------|--------|
| 0     | Black  |
| 1     | Red    |
| 2     | Green  |
| 3     | Blue   |
| 4     | Yellow |
| 5     | Orange |

```javascript
GoDice.prototype.onDiceColor = (diceId, color) => {
    const colors = ['Black', 'Red', 'Green', 'Blue', 'Yellow', 'Orange'];
    console.log("Die color:", colors[color]);
};
```

---

### Event Callbacks

#### `onRollStart(diceId)`
Called when the die starts rolling.

```javascript
GoDice.prototype.onRollStart = (diceId) => {
    console.log("Rolling...", diceId);
};
```

#### `onStable(diceId, value, xyzArray)`
Called when the die is stable after a legitimate roll.

- `value` — The rolled value (depends on die type)
- `xyzArray` — Raw accelerometer data `[x, y, z]`

```javascript
GoDice.prototype.onStable = (diceId, value, xyzArray) => {
    console.log("Rolled:", value, "Acc:", xyzArray);
};
```

#### `onTiltStable(diceId, xyzArray, value)`
Called when the die is stable but not flat (tilted).

#### `onFakeStable(diceId, value, xyzArray)`
Called when the die is stable after a "fake" roll (e.g., placed by hand).

#### `onMoveStable(diceId, value, xyzArray)`
Called when the die stabilizes after a small movement (rotating from one face to another).

---

## Dice Types (Shells)

Use `GoDice.diceTypes` to configure the physical shell:

```javascript
GoDice.diceTypes.D6    // 0 (default)
GoDice.diceTypes.D20   // 1
GoDice.diceTypes.D10   // 2
GoDice.diceTypes.D10X  // 3
GoDice.diceTypes.D4    // 4
GoDice.diceTypes.D8    // 5
GoDice.diceTypes.D12   // 6
```

The die internally uses D6 or D24 vectors and transforms the result according to the selected shell type.
