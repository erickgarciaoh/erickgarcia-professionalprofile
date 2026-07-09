import { gsap, mm, MOTION_OK } from './core';
import { SplitText } from 'gsap/SplitText';

// The Promise section (v3 §2.5): kinetic typography over the thesis sentence,
// scrub-read with scroll — no pin, no scenes, ~70vh of scroll. Reduced-motion
// and no-JS visitors get the static, fully-composed sentence with amber
// already lit and zero timelines created.

const WORD_EACH = 0.4; // per-word alpha/rise duration within the scrub timeline
const WORD_STEP = 0.14; // stagger between successive words
const ACCENT_LIGHT = 0.25; // amber colour tween duration

function initPromiseType(): (() => void) | void {
	const sentence = document.querySelector<HTMLElement>('.promise-sentence');
	if (!sentence) return;

	// aria: 'none' — the sentence is already aria-hidden (a permanent .sr-only
	// twin carries the accessible text), so SplitText must not also inject its
	// own aria-label onto the <p> (invalid without an explicit ARIA role).
	const split = new SplitText(sentence, { type: 'words', wordsClass: 'promise-word', aria: 'none' });
	const words = split.words as HTMLElement[];
	if (words.length === 0) {
		split.revert();
		return;
	}

	// Accent words ("optimized end to end") — prefer the authored span, fall
	// back to matching text so the amber assignment survives SplitText DOM churn.
	let accentWords = Array.from(sentence.querySelectorAll<HTMLElement>('.accent-words .promise-word'));
	if (accentWords.length === 0) {
		const accentText = new Set(['optimized', 'end', 'to']);
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
			end: '+=70%', // ~70vh scrub, no pinning — a pause, not a second star moment
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

export default function initPromise(): void {
	mm.add(MOTION_OK, () => {
		const cleanup = initPromiseType();
		return cleanup;
	});
}
