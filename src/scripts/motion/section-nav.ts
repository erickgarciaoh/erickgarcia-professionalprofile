const SPY_MARGIN = '-45% 0px -45% 0px';

export default function initSectionNav(): void {
	const nav = document.querySelector<HTMLElement>('.section-nav');
	if (!nav || !('IntersectionObserver' in window)) return;

	const dots = new Map<string, HTMLAnchorElement>();
	nav.querySelectorAll<HTMLAnchorElement>('[data-target]').forEach((dot) => {
		const target = dot.dataset.target;
		if (target) dots.set(target, dot);
	});

	const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section-label]'));
	if (sections.length === 0) return;

	const setActive = (id: string, section: HTMLElement) => {
		dots.forEach((dot, key) => {
			if (key === id) {
				dot.setAttribute('aria-current', 'true');
			} else {
				dot.removeAttribute('aria-current');
			}
		});
		// The nav is a fixed overlay; it can't know via CSS what scrolls under it.
		// Mirror the active section's theme onto the nav so the label + dots switch
		// to the palette that clears AA on that surface (P6-04 A11Y-3: the fixed
		// light-world colour failed contrast on both the light canvas and the dark
		// #projects/#metrics/#toolkit band).
		nav.classList.toggle('is-over-dark', section.dataset.theme === 'dark');
	};

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && entry.target.id) {
					setActive(entry.target.id, entry.target as HTMLElement);
				}
			});
		},
		{ rootMargin: SPY_MARGIN, threshold: 0 },
	);

	sections.forEach((section) => observer.observe(section));
}
