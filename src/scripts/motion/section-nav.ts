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

	const setActive = (id: string) => {
		dots.forEach((dot, key) => {
			if (key === id) {
				dot.setAttribute('aria-current', 'true');
			} else {
				dot.removeAttribute('aria-current');
			}
		});
	};

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && entry.target.id) {
					setActive(entry.target.id);
				}
			});
		},
		{ rootMargin: SPY_MARGIN, threshold: 0 },
	);

	sections.forEach((section) => observer.observe(section));
}
