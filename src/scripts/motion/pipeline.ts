import { gsap, mm, MOTION_OK } from './core';
import { SplitText } from 'gsap/SplitText';

// Statement — the ONE star moment (§2.4). Two beats live here:
//   1. Kinetic typography over the thesis sentence (scrub-read).
//   2. The four PipelineSteps scenes, each a one-shot timeline on its own
//      enter trigger, built with the shared `sequence()` helper (§1.4).
// Everything is gated behind `mm.add(MOTION_OK, ...)` so reduced-motion users
// (and no-JS visitors) get the static, fully-composed final scenes with zero
// timelines created — no runtime `if (reducedMotion)` branches.

// --- Beat 1: kinetic typography (P4-01) ---------------------------------

const WORD_EACH = 0.4; // per-word alpha/rise duration within the scrub timeline
const WORD_STEP = 0.14; // stagger between successive words
const ACCENT_LIGHT = 0.25; // amber colour tween duration

function initStatementType(): (() => void) | void {
	const sentence = document.querySelector<HTMLElement>('.statement-sentence');
	if (!sentence) return;

	const split = new SplitText(sentence, { type: 'words', wordsClass: 'stmt-word' });
	const words = split.words as HTMLElement[];
	if (words.length === 0) {
		split.revert();
		return;
	}

	// Accent words ("understandable visuals") — prefer the authored span, fall
	// back to matching text so the amber assignment survives SplitText DOM churn.
	let accentWords = Array.from(sentence.querySelectorAll<HTMLElement>('.accent-words .stmt-word'));
	if (accentWords.length === 0) {
		const accentText = new Set(['understandable', 'visuals']);
		accentWords = words.filter((w) => accentText.has(w.textContent?.trim().toLowerCase() ?? ''));
	}

	// Resolve concrete colours so GSAP interpolates the amber ignition cleanly.
	const inkColor = getComputedStyle(words[0]).color;
	const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

	// From-state (JS-only, pattern 1): dim the whole sentence and de-amber the
	// accent words so they can light up on scroll.
	gsap.set(words, { autoAlpha: 0.18, y: 12 });
	if (accentWords.length > 0) gsap.set(accentWords, { color: inkColor });

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: sentence,
			start: 'top 80%',
			end: '+=120%', // ~120vh scrub, no pinning
			scrub: 0.6,
		},
	});

	tl.to(words, { autoAlpha: 1, y: 0, ease: 'none', duration: WORD_EACH, stagger: { each: WORD_STEP } }, 0);

	// Amber ignites only once the last accent word's alpha has completed.
	if (accentWords.length > 0) {
		const lastAccentIdx = words.indexOf(accentWords[accentWords.length - 1]);
		const accentDoneAt = (lastAccentIdx < 0 ? words.length - 1 : lastAccentIdx) * WORD_STEP + WORD_EACH;
		tl.to(accentWords, { color: accentColor, ease: 'none', duration: ACCENT_LIGHT }, accentDoneAt);
	}

	return () => {
		tl.scrollTrigger?.kill();
		tl.kill();
		split.revert(); // restores the original sentence + static amber accent
	};
}

export default function initPipeline(): void {
	mm.add(MOTION_OK, () => {
		const cleanups: (() => void)[] = [];

		const typeCleanup = initStatementType();
		if (typeCleanup) cleanups.push(typeCleanup);

		return () => cleanups.forEach((cleanup) => cleanup());
	});
}
