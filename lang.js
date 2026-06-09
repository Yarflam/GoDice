/**
 * Internationalization module for GoDice Controller
 */

const DEFAULT_LANG = 'fr';
const STORAGE_KEY = 'godice-lang';

const TRANSLATIONS = {
	fr: {
		title: 'GoDice Controller',
		tagline: 'Contrôlez vos dés connectés',
		connectBtn: 'Connecter un dé',
		emptyTitle: 'Aucun dé connecté',
		emptyDesc: 'Cliquez sur',
		emptyDescEnd: 'pour commencer.',
		ready: 'Prêt',
		rolling: '...',
		disconnected: 'Déconnecté',
		diceColorLabel: 'Couleur LED',
		choose: 'Choisir',
		lightingMode: "Mode d'éclairage",
		off: 'Éteint',
		on: 'Allumé',
		pulse: 'Pulsation',
		conditional: 'Conditionnel',
		pulseSpeed: 'Vitesse pulsation',
		conditionalColors: 'Couleurs par face',
		batteryTooltip: 'Cliquer pour rafraîchir',
		refreshBattery: 'Actualiser batterie',
		dice: 'Dé',
		messageDiceColor: 'Dé',
	},
	en: {
		title: 'GoDice Controller',
		tagline: 'Control your connected dice',
		connectBtn: 'Connect a die',
		emptyTitle: 'No dice connected',
		emptyDesc: 'Click',
		emptyDescEnd: 'to get started.',
		ready: 'Ready',
		rolling: '...',
		disconnected: 'Disconnected',
		diceColorLabel: 'LED Color',
		choose: 'Choose',
		lightingMode: 'Lighting Mode',
		off: 'Off',
		on: 'On',
		pulse: 'Pulse',
		conditional: 'Conditional',
		pulseSpeed: 'Pulse Speed',
		conditionalColors: 'Colors by face',
		batteryTooltip: 'Click to refresh',
		refreshBattery: 'Refresh battery',
		dice: 'Dice',
		messageDiceColor: 'Dice',
	}
};

const DICE_COLOR_NAMES = {
	fr: ['Noir', 'Rouge', 'Vert', 'Bleu', 'Jaune', 'Orange'],
	en: ['Black', 'Red', 'Green', 'Blue', 'Yellow', 'Orange']
};

const PULSE_SPEED_LABELS = {
	fr: { slow: 'Lent', normal: 'Normal', fast: 'Rapide' },
	en: { slow: 'Slow', normal: 'Normal', fast: 'Fast' }
};

function getLang() {
	return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
}

function setLang(lang) {
	if (!TRANSLATIONS[lang]) lang = DEFAULT_LANG;
	localStorage.setItem(STORAGE_KEY, lang);
	document.documentElement.lang = lang;
	translateStaticPage();
	// Notify main.js to refresh dynamic content
	if (typeof onLangChange === 'function') {
		onLangChange();
	}
}

function t(key, lang) {
	const l = lang || getLang();
	return (TRANSLATIONS[l] && TRANSLATIONS[l][key]) || key;
}

function getDiceColorNames() {
	return DICE_COLOR_NAMES[getLang()];
}

function getPulseSpeedLabels() {
	return PULSE_SPEED_LABELS[getLang()];
}

function translateStaticPage() {
	const l = getLang();
	const tr = TRANSLATIONS[l];
	if (!tr) return;

	// Header
	const tagline = document.querySelector('.tagline');
	if (tagline) tagline.textContent = tr.tagline;

	// Connect button
	const connectBtn = document.querySelector('.connect-btn');
	if (connectBtn) {
		connectBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg> ${tr.connectBtn}`;
	}

	// Empty state
	const emptyTitle = document.querySelector('.empty-state h2');
	if (emptyTitle) emptyTitle.textContent = tr.emptyTitle;

	const emptyDesc = document.querySelector('.empty-state p');
	if (emptyDesc) {
		emptyDesc.innerHTML = `${tr.emptyDesc} <strong>"${tr.connectBtn}"</strong> ${tr.emptyDescEnd}`;
	}

	// Lang selector
	const langSelect = document.getElementById('lang-select');
	if (langSelect) langSelect.value = l;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
	const saved = getLang();
	document.documentElement.lang = saved;
	translateStaticPage();
});
