document.addEventListener('DOMContentLoaded', () => {
	// Reveal on scroll
	const revealTargets = document.querySelectorAll('header, .paper, .route-card, .line, footer, .roadmap, .spotlight, .now-card');
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				observer.unobserve(entry.target);
			}
		});
	}, { threshold: 0.2 });

	revealTargets.forEach((el) => {
		if (!el.classList.contains('reveal')) {
			el.classList.add('reveal');
		}
		observer.observe(el);
	});

	// Subtle tilt for cards/buttons
	const tiltTargets = document.querySelectorAll('.route-card, .btn');

	tiltTargets.forEach((el) => {
		el.addEventListener('pointermove', (event) => {
			const rect = el.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const deltaX = (event.clientX - centerX) / (rect.width / 2);
			const deltaY = (event.clientY - centerY) / (rect.height / 2);
			const rotateX = Math.max(Math.min(-deltaY * 4, 6), -6);
			const rotateY = Math.max(Math.min(deltaX * 4, 6), -6);
			el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
		});

		el.addEventListener('pointerleave', () => {
			el.style.transform = '';
		});
	});

	// Parallax for grain/background (throttled via rAF for smoothness)
	const parallaxState = { x: 0, y: 0, pending: false };
	const applyParallax = () => {
		document.documentElement.style.setProperty('--parallax-x', `${parallaxState.x}px`);
		document.documentElement.style.setProperty('--parallax-y', `${parallaxState.y}px`);
		parallaxState.pending = false;
	};

	document.addEventListener('pointermove', (event) => {
		parallaxState.x = ((event.clientX / window.innerWidth) - 0.5) * 8;
		parallaxState.y = ((event.clientY / window.innerHeight) - 0.5) * 8;
		if (!parallaxState.pending) {
			parallaxState.pending = true;
			requestAnimationFrame(applyParallax);
		}
	});

	// Audio cues
	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	const audioState = { enabled: false, ctx: null };
	const audioToggle = document.getElementById('audio-toggle');

	const ensureAudio = () => {
		if (!audioState.ctx && AudioContextClass) {
			audioState.ctx = new AudioContextClass();
		}
	};

	const labelAudio = () => {
		if (audioToggle) {
			audioToggle.textContent = audioState.enabled ? 'Sound: On' : 'Sound: Off';
			audioToggle.setAttribute('aria-pressed', audioState.enabled.toString());
		}
	};

	const playClick = () => {
		if (!audioState.enabled || !audioState.ctx) return;
		const ctx = audioState.ctx;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'square';
		osc.frequency.value = 900;
		gain.gain.setValueAtTime(0.08, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
		osc.connect(gain).connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.1);
	};

	const playWhoosh = () => {
		if (!audioState.enabled || !audioState.ctx) return;
		const ctx = audioState.ctx;
		const bufferSize = ctx.sampleRate * 0.25;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i += 1) {
			data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
		}
		const noise = ctx.createBufferSource();
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.05, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
		noise.buffer = buffer;
		noise.connect(gain).connect(ctx.destination);
		noise.start();
		noise.stop(ctx.currentTime + 0.25);
	};

	if (audioToggle) {
		audioToggle.addEventListener('click', () => {
			audioState.enabled = !audioState.enabled;
			ensureAudio();
			labelAudio();
			if (audioState.enabled && audioState.ctx && audioState.ctx.state === 'suspended') {
				audioState.ctx.resume();
			}
		});
		labelAudio();
	}

	// Ripple effect for buttons + click sound
	const buttons = document.querySelectorAll('.btn');

	buttons.forEach((btn) => {
		btn.addEventListener('click', (event) => {
			const href = btn.getAttribute('href');
			if (href === '#' || href === '' || href === null) {
				event.preventDefault();
			}
			const ripple = document.createElement('span');
			ripple.className = 'ripple';
			const rect = btn.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height);
			ripple.style.width = ripple.style.height = `${size}px`;
			ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
			ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
			btn.appendChild(ripple);
			ripple.addEventListener('animationend', () => ripple.remove());
			playClick();
		});
	});

	// Hover whoosh on route cards
	const routeCards = document.querySelectorAll('.route-card');
	routeCards.forEach((card) => {
		card.addEventListener('mouseenter', () => playWhoosh());
	});

	// Spotlight toggle
	const spotlightToggle = document.getElementById('spotlight-toggle');
	const engineerPanel = document.querySelector('.spotlight-panel.engineer');
	const directorPanel = document.querySelector('.spotlight-panel.director');
	let spotlightState = 'engineer';

	if (spotlightToggle && engineerPanel && directorPanel) {
		spotlightToggle.addEventListener('click', () => {
			spotlightState = spotlightState === 'engineer' ? 'director' : 'engineer';
			spotlightToggle.classList.toggle('active', spotlightState === 'director');
			spotlightToggle.setAttribute('aria-pressed', spotlightState === 'director');
			engineerPanel.classList.toggle('active', spotlightState === 'engineer');
			directorPanel.classList.toggle('active', spotlightState === 'director');
			playClick();
		});
	}

	// Contact bar toggle
	const contactToggle = document.getElementById('contact-toggle');
	const contactBar = document.getElementById('contact-bar');

	if (contactToggle && contactBar) {
		const setState = (open) => {
			contactBar.classList.toggle('open', open);
			contactToggle.setAttribute('aria-expanded', open.toString());
			contactBar.setAttribute('aria-hidden', (!open).toString());
			contactToggle.textContent = open ? 'Close' : 'Reach me';
		};

		setState(false);

		contactToggle.addEventListener('click', () => {
			const open = !contactBar.classList.contains('open');
			setState(open);
		});
	}
});
