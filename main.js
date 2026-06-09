const connectedDice = {};
const diceIntervals = {};   // Stores intervals for persistent LED effects
const diceLedState = {};    // Stores current LED state per die

// Mappings
const DICE_COLOR_NAMES = ['Noir', 'Rouge', 'Vert', 'Bleu', 'Jaune', 'Orange'];
const DIE_TYPE_LABELS = {
	[GoDice.diceTypes.D6]:   'D6',
	[GoDice.diceTypes.D20]:  'D20',
	[GoDice.diceTypes.D10]:  'D10',
	[GoDice.diceTypes.D10X]: 'D10X',
	[GoDice.diceTypes.D4]:   'D4',
	[GoDice.diceTypes.D8]:   'D8',
	[GoDice.diceTypes.D12]:  'D12',
};

// Pulse speed presets — tuned to ~6s total duration so stopping feels responsive
const PULSE_PRESETS = {
	slow:   { onTime: 30, offTime: 30, pulseCount: 10, label: 'Lent' },    // 10 × 600ms = 6s
	normal: { onTime: 20, offTime: 20, pulseCount: 15, label: 'Normal' },  // 15 × 400ms = 6s
	fast:   { onTime: 10, offTime: 10, pulseCount: 30, label: 'Rapide' },  // 30 × 200ms = 6s
};

// Icons SVG
const ICONS = {
	sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
	moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
	activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
	battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/></svg>',
	zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
};

// Open the Bluetooth connection dialog for choosing a GoDice to connect
function openConnectionDialog() {
	const newDice = new GoDice();
	newDice.requestDevice();
}

/**
 * Get a new dice element or its instance if it already exists
 * @param {string} diceID - the die unique identifier
 */
function getDiceHtmlEl(diceID) {
	if (!document.getElementById(diceID)) {
		const newDiceEl = document.createElement("div");
		newDiceEl.id = diceID;
		newDiceEl.className = "dice-wrapper";
		return newDiceEl;
	}
	return document.getElementById(diceID);
}

/**
 * Convert hex color to RGB array [R, G, B]
 */
function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16)
	] : [0, 0, 255];
}

/**
 * Update dice header title with type + physical color
 */
function updateDiceHeader(diceId) {
	const state = diceLedState[diceId];
	if (!state) return;

	const headerTitle = document.getElementById(`${diceId}-header-title`);
	if (!headerTitle) return;

	const colorName = state.dieColorName || '…';
	headerTitle.textContent = `Dé ${colorName}`;
}

/**
 * Calculate total pulse duration in ms for a preset
 */
function getPulseDurationMs(presetKey) {
	const p = PULSE_PRESETS[presetKey] || PULSE_PRESETS.normal;
	return p.pulseCount * (p.onTime + p.offTime) * 10;
}

/**
 * Clear any persistent LED interval for a die
 */
function clearLedInterval(diceId) {
	if (diceIntervals[diceId]) {
		clearInterval(diceIntervals[diceId]);
		delete diceIntervals[diceId];
	}
}

/**
 * Apply LED mode for a die based on current state.
 * Only forces LEDs off when actually leaving pulse mode.
 */
function applyLedMode(diceId, instance) {
	const state = diceLedState[diceId];
	if (!state) return;

	const leavingPulse = state.lastMode === 'pulse';
	const enteringPulse = state.mode === 'pulse';

	// Stop any JavaScript interval
	clearLedInterval(diceId);

	// If we're leaving pulse mode for a non-pulse mode, cancel the active pulse
	// by sending a zero-length pulse on the same command ID, then apply the new mode
	if (leavingPulse && !enteringPulse) {
		instance.pulseLed(0, 0, 0, [0, 0, 0]);
	}

	const rgb = hexToRgb(state.color);

	if (state.mode === 'on') {
		instance.setLed(rgb, rgb);
	} else if (state.mode === 'off') {
		instance.setLed([0], [0]);
	} else if (state.mode === 'pulse') {
		const preset = PULSE_PRESETS[state.pulseSpeed] || PULSE_PRESETS.normal;
		const durationMs = getPulseDurationMs(state.pulseSpeed) + 500; // small buffer

		// Start pulse immediately
		instance.pulseLed(preset.pulseCount, preset.onTime, preset.offTime, rgb);

		// Re-pulse when the sequence ends to keep it going forever
		diceIntervals[diceId] = setInterval(() => {
			instance.pulseLed(preset.pulseCount, preset.onTime, preset.offTime, rgb);
		}, durationMs);
	}

	// Update lastMode to current for next transition
	state.lastMode = state.mode;
}

/**
 * Set LED mode for a die and update UI
 */
function setLedMode(diceId, mode, btn) {
	const state = diceLedState[diceId];
	if (!state) return;

	// Remember where we're coming from before changing
	state.lastMode = state.mode;
	state.mode = mode;

	// Update UI buttons
	const wrapper = document.getElementById(diceId);
	const buttons = wrapper.querySelectorAll('.led-mode-btn');
	buttons.forEach(b => b.classList.remove('active'));
	btn.classList.add('active');

	// Apply to die
	applyLedMode(diceId, connectedDice[diceId]);
}

/**
 * Set pulse speed for a die
 */
function setPulseSpeed(diceId, speedKey, btn) {
	const state = diceLedState[diceId];
	if (!state) return;

	state.pulseSpeed = speedKey;

	// Update UI
	const wrapper = document.getElementById(diceId);
	const buttons = wrapper.querySelectorAll('.pulse-speed-btn');
	buttons.forEach(b => b.classList.remove('active'));
	btn.classList.add('active');

	// If already in pulse mode, restart with new speed
	if (state.mode === 'pulse') {
		applyLedMode(diceId, connectedDice[diceId]);
	}
}

/**
 * Handle color change from picker
 */
function onColorChange(diceId, input) {
	const state = diceLedState[diceId];
	if (!state) return;

	state.color = input.value;

	// Update preview strip
	const wrapper = document.getElementById(diceId);
	const strip = wrapper.querySelector('.color-preview-strip');
	if (strip) {
		strip.style.background = input.value;
		strip.style.opacity = '1';
	}

	// Re-apply current mode with new color
	// applyLedMode handles lastMode internally so it won't force-off when staying in pulse
	applyLedMode(diceId, connectedDice[diceId]);
}

GoDice.prototype.onDiceConnected = (diceId, diceInstance) => {
	console.log("Dice connected: ", diceId);

	// Hide empty state
	const emptyState = document.getElementById('empty-state');
	if (emptyState) emptyState.classList.add('hidden');

	// Track die
	connectedDice[diceId] = diceInstance;

	// Initialize LED state
	if (!diceLedState[diceId]) {
		diceLedState[diceId] = {
			color: '#00aaff',
			mode: 'off',
			lastMode: 'off',
			pulseSpeed: 'normal',
			dieType: GoDice.diceTypes.D6,
			dieColorName: null,
			batteryLevel: null,
			showBattery: false
		};
	}
	const state = diceLedState[diceId];

	// Auto-request physical dice color on connect
	diceInstance.getDiceColor();

	// Get or create die element
	const diceHtmlEl = getDiceHtmlEl(diceId);

	// Clear existing content
	while (diceHtmlEl.firstChild) {
		diceHtmlEl.removeChild(diceHtmlEl.lastChild);
	}

	// ===== HEADER =====
	const header = document.createElement('div');
	header.className = 'dice-header';

	const nameArea = document.createElement('div');
	nameArea.className = 'dice-name';

	const statusDot = document.createElement('span');
	statusDot.className = 'dice-status-dot';
	statusDot.id = `${diceId}-status-dot`;

	const nameText = document.createElement('span');
	nameText.id = `${diceId}-header-title`;
	nameText.textContent = 'Dé …';

	nameArea.append(statusDot, nameText);

	const batteryBadge = document.createElement('span');
	batteryBadge.className = 'battery-badge';
	batteryBadge.id = `${diceId}-battery-indicator`;
	batteryBadge.innerHTML = `${ICONS.battery} --%`;
	batteryBadge.style.cursor = 'pointer';
	batteryBadge.title = 'Cliquer pour rafraîchir';
	batteryBadge.onclick = () => diceInstance.getBatteryLevel();

	header.append(nameArea, batteryBadge);
	diceHtmlEl.append(header);

	// ===== ROLL VALUE =====
	const rollSection = document.createElement('div');
	rollSection.className = 'dice-section';

	const rollValue = document.createElement('div');
	rollValue.className = 'roll-value';
	rollValue.id = `${diceId}-die-status`;
	rollValue.textContent = 'Prêt';

	rollSection.append(rollValue);
	diceHtmlEl.append(rollSection);

	// ===== LED COLOR =====
	const colorSection = document.createElement('div');
	colorSection.className = 'dice-section';

	const colorLabel = document.createElement('div');
	colorLabel.className = 'section-label';
	colorLabel.textContent = 'Couleur LED';

	const colorControl = document.createElement('div');
	colorControl.className = 'color-control';

	const colorPicker = document.createElement('div');
	colorPicker.className = 'color-picker-wrapper';

	const colorInput = document.createElement('input');
	colorInput.type = 'color';
	colorInput.className = 'color-input';
	colorInput.value = state.color;
	colorInput.oninput = () => onColorChange(diceId, colorInput);

	const colorLabelText = document.createElement('label');
	colorLabelText.textContent = 'Choisir';

	colorPicker.append(colorLabelText, colorInput);
	colorControl.append(colorPicker);
	colorSection.append(colorLabel, colorControl);
	diceHtmlEl.append(colorSection);

	// ===== LED MODE =====
	const modeSection = document.createElement('div');
	modeSection.className = 'dice-section';

	const modeLabel = document.createElement('div');
	modeLabel.className = 'section-label';
	modeLabel.textContent = 'Mode d\'éclairage';

	const modeBtns = document.createElement('div');
	modeBtns.className = 'led-modes';

	const btnOff = document.createElement('button');
	btnOff.className = 'led-mode-btn' + (state.mode === 'off' ? ' active' : '');
	btnOff.innerHTML = `${ICONS.moon} Éteint`;
	btnOff.onclick = () => setLedMode(diceId, 'off', btnOff);

	const btnOn = document.createElement('button');
	btnOn.className = 'led-mode-btn' + (state.mode === 'on' ? ' active' : '');
	btnOn.innerHTML = `${ICONS.sun} Allumé`;
	btnOn.onclick = () => setLedMode(diceId, 'on', btnOn);

	const btnPulse = document.createElement('button');
	btnPulse.className = 'led-mode-btn' + (state.mode === 'pulse' ? ' active' : '');
	btnPulse.innerHTML = `${ICONS.activity} Pulsation`;
	btnPulse.onclick = () => setLedMode(diceId, 'pulse', btnPulse);

	modeBtns.append(btnOff, btnOn, btnPulse);
	modeSection.append(modeLabel, modeBtns);
	diceHtmlEl.append(modeSection);

	// ===== PULSE SPEED =====
	const speedSection = document.createElement('div');
	speedSection.className = 'dice-section';

	const speedLabel = document.createElement('div');
	speedLabel.className = 'section-label';
	speedLabel.innerHTML = `${ICONS.zap} Vitesse pulsation`;

	const speedBtns = document.createElement('div');
	speedBtns.className = 'led-modes';

	Object.entries(PULSE_PRESETS).forEach(([key, preset]) => {
		const btn = document.createElement('button');
		btn.className = 'pulse-speed-btn led-mode-btn' + (state.pulseSpeed === key ? ' active' : '');
		btn.textContent = preset.label;
		btn.onclick = () => setPulseSpeed(diceId, key, btn);
		speedBtns.append(btn);
	});

	speedSection.append(speedLabel, speedBtns);
	diceHtmlEl.append(speedSection);

	// ===== COLOR PREVIEW STRIP =====
	const previewStrip = document.createElement('div');
	previewStrip.className = 'color-preview-strip';
	previewStrip.style.background = state.color;
	diceHtmlEl.append(previewStrip);

	// Inject into grid
	const diceHost = document.getElementById("dice-host");
	diceHost.appendChild(diceHtmlEl);
};

GoDice.prototype.onRollStart = (diceId) => {
	console.log("Roll Start: ", diceId);

	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	if (diceIndicatorEl) {
		diceIndicatorEl.textContent = "...";
		diceIndicatorEl.classList.add("rolling");
	}
};

GoDice.prototype.onDiceDisconnected = (diceId, diceInstance) => {
	console.log("Dice disconnected: ", diceId);

	// Stop any LED intervals
	clearLedInterval(diceId);

	const statusDot = document.getElementById(diceId + "-status-dot");
	if (statusDot) statusDot.classList.add("disconnected");

	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	if (diceIndicatorEl) {
		diceIndicatorEl.textContent = "Déconnecté";
		diceIndicatorEl.classList.remove("rolling");
	}

	// Attempt to reconnect
	diceInstance.attemptReconnect(diceId, diceInstance);
};

GoDice.prototype.onStable = (diceId, value, xyzArray) => {
	console.log("Stable event: ", diceId, value);

	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	if (diceIndicatorEl) {
		diceIndicatorEl.textContent = value;
		diceIndicatorEl.classList.remove("rolling");
	}
};

GoDice.prototype.onTiltStable = (diceId, xyzArray, value) => {
	console.log("TiltStable: ", diceId, xyzArray);

	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	if (diceIndicatorEl) {
		diceIndicatorEl.textContent = value;
		diceIndicatorEl.classList.remove("rolling");
	}
};

GoDice.prototype.onFakeStable = (diceId, value, xyzArray) => {
	console.log("FakeStable: ", diceId, value);

	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	if (diceIndicatorEl) {
		diceIndicatorEl.textContent = value;
		diceIndicatorEl.classList.remove("rolling");
	}
};

GoDice.prototype.onMoveStable = (diceId, value, xyzArray) => {
	console.log("MoveStable: ", diceId, value);

	const diceIndicatorEl = document.getElementById(diceId + "-die-status");
	if (diceIndicatorEl) {
		diceIndicatorEl.textContent = value;
		diceIndicatorEl.classList.remove("rolling");
	}
};

GoDice.prototype.onBatteryLevel = (diceId, batteryLevel) => {
	console.log("BatteryLevel: ", diceId, batteryLevel);

	const state = diceLedState[diceId];
	if (state) state.batteryLevel = batteryLevel;

	const batteryLevelEl = document.getElementById(diceId + "-battery-indicator");
	if (batteryLevelEl) {
		batteryLevelEl.innerHTML = `${ICONS.battery} ${batteryLevel}%`;
		if (batteryLevel <= 20) {
			batteryLevelEl.classList.add('low');
		} else {
			batteryLevelEl.classList.remove('low');
		}
	}
};

GoDice.prototype.onDiceColor = (diceId, color) => {
	console.log("DiceColor: ", diceId, color);

	const colorName = DICE_COLOR_NAMES[color] || `Couleur ${color}`;

	const state = diceLedState[diceId];
	if (state) {
		state.dieColorName = colorName;
		updateDiceHeader(diceId);
	}
};
