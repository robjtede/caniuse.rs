// Yew owns the release markup. This element owns scrolling and browser event lifetimes.
class ReleaseAtlas extends HTMLElement {
    connectedCallback() {
        this.setupFrame = requestAnimationFrame(() => this.setup());
    }

    disconnectedCallback() {
        cancelAnimationFrame(this.setupFrame);
        cancelAnimationFrame(this.paintFrame);
        this.paintFrame = null;
        clearTimeout(this.announceTimer);
        this.events?.abort();
        this.resizeObserver?.disconnect();
        this.contentObserver?.disconnect();
    }

    setup() {
        this.viewport = this.querySelector('.atlas-viewport');
        this.panels = [...this.querySelectorAll('.atlas-release')];

        if (!this.viewport || !this.panels.length) {
            return;
        }

        this.events = new AbortController();
        this.timeline = this.querySelector('.atlas-timeline');
        this.plane = this.querySelector('.atlas-timeline-plane');
        this.ticks = [...this.querySelectorAll('.atlas-tick')];
        const navigation = document.querySelector('header .atlas-navigation');

        this.select = navigation.querySelector('select');
        this.previous = navigation.querySelector('[data-action="previous"]');
        this.next = navigation.querySelector('[data-action="next"]');
        this.announcement = this.querySelector('.atlas-announcement');
        this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        this.spacing = 112;
        this.active = -1;
        this.step = 1;
        this.panelState = new Map();
        this.contentObserver = new MutationObserver(() => this.restorePanelState());
        this.contentObserver.observe(this.querySelector('.atlas-track'), { childList: true, subtree: true });

        const hashIndex = this.hashIndex();
        const initial = this.dataset.initialVersion;

        this.index = hashIndex >= 0 ? hashIndex
            : Math.max(0, this.panels.findIndex(panel => panel.dataset.version === initial));
        this.listen(window, 'hashchange', () => {
            const index = this.hashIndex();

            if (index >= 0) this.go(index, true);
        });
        this.listen(this.viewport, 'scroll', () => this.schedulePaint(), { passive: true });
        this.listen(this.viewport, 'scrollend', () => {
            this.paint();

            // A previous scroll can finish after a new destination was requested.
            if (Math.abs(this.viewport.scrollLeft - this.destination * this.step) < 1) {
                this.destination = null;
            }
        });
        this.listen(this.viewport, 'wheel', () => { this.destination = null; }, { passive: true });
        this.listen(this.viewport, 'pointerdown', () => { this.destination = null; }, { passive: true });
        this.listen(this.viewport, 'keydown', event => this.keyboard(event));
        this.listen(this.timeline, 'keydown', event => this.keyboard(event));
        this.listen(this.select, 'change', () => this.go(this.select.selectedIndex));
        this.listen(this.previous, 'click', () => this.go((this.destination ?? this.index) - 1));
        this.listen(this.next, 'click', () => this.go((this.destination ?? this.index) + 1));
        this.bindDrag(this.viewport, false);
        this.bindDrag(this.timeline, true);
        this.resizeObserver = new ResizeObserver(() => this.layout());
        this.resizeObserver.observe(this.viewport);
        this.layout();
        this.dataset.ready = 'true';
    }

    listen(target, name, callback, options = {}) {
        target.addEventListener(name, callback, { ...options, signal: this.events.signal });
    }

    hashIndex() {
        return this.panels.findIndex(panel => '#' + panel.dataset.version === location.hash);
    }

    layout() {
        const index = this.index;
        const first = this.panels[0];
        const gap = parseFloat(getComputedStyle(this.querySelector('.atlas-track')).gap);

        this.panelWidth = first.getBoundingClientRect().width;
        this.step = this.panelWidth + gap;
        this.viewportWidth = this.viewport.clientWidth;
        this.inset = Math.max(0, (this.viewportWidth - this.panelWidth) / 2);
        first.style.marginLeft = this.inset + 'px';

        const spacer = this.querySelector('.atlas-spacer');

        spacer.style.flexBasis = this.inset + 'px';
        spacer.style.marginLeft = -gap + 'px';
        this.ticks.forEach((tick, i) => {
            tick.style.left = i * this.spacing + 'px';
        });
        this.plane.style.width = (this.panels.length - 1) * this.spacing + 'px';
        this.viewport.scrollLeft = index * this.step;
        this.paint();
    }

    schedulePaint() {
        if (this.paintFrame) {
            return;
        }

        this.paintFrame = requestAnimationFrame(() => {
            this.paintFrame = null;
            this.paint();
        });
    }

    paint() {
        // Read layout before any DOM writes. Interleaving these forces synchronous layout.
        const scrollLeft = this.viewport.scrollLeft;
        const viewportWidth = this.viewport.clientWidth;
        const timelineWidth = this.timeline.clientWidth;

        // A resize can send a scroll event before ResizeObserver runs.
        if (viewportWidth !== this.viewportWidth) {
            this.layout();
            return;
        }

        const fraction = Math.max(0, Math.min(this.panels.length - 1, scrollLeft / this.step));
        const index = Math.round(fraction);
        const center = timelineWidth / 2;

        const offset = fraction * this.spacing;

        this.updateWindow(index, viewportWidth);

        const transform = 'translate3d(' + (center - offset) + 'px, 0, 0)';

        if (this.plane.style.transform !== transform) {
            this.plane.style.transform = transform;
        }

        const previousDisabled = fraction < 0.01;
        const nextDisabled = fraction > this.panels.length - 1.01;

        if (this.previous.disabled !== previousDisabled) this.previous.disabled = previousDisabled;
        if (this.next.disabled !== nextDisabled) this.next.disabled = nextDisabled;

        this.panels.forEach((panel, i) => {
            const left = this.inset + i * this.step - scrollLeft;
            const inert = left + this.panelWidth <= 0 || left >= viewportWidth;

            if (panel.inert !== inert) panel.inert = inert;
        });

        this.ticks.forEach((tick, i) => {
            const x = center + i * this.spacing - offset;
            const tabIndex = x > 24 && x < timelineWidth - 24 ? 0 : -1;
            const current = String(i === index);

            if (tick.tabIndex !== tabIndex) tick.tabIndex = tabIndex;
            if (tick.getAttribute('aria-current') !== current) tick.setAttribute('aria-current', current);
        });

        this.index = index;

        if (this.active !== index) {
            this.active = index;
            this.select.selectedIndex = index;
            const panel = this.panels[index];
            const label = panel.dataset.channel || 'Rust ' + panel.dataset.version;

            clearTimeout(this.announceTimer);
            this.announceTimer = setTimeout(() => {
                this.announcement.textContent = label;
                const hash = '#' + panel.dataset.version;

                // Keep scroll updates shareable without adding one history entry per release.
                if (location.hash !== hash) {
                    history.replaceState(history.state, '', location.pathname + location.search + hash);
                }
            }, 180);
        }
    }

    go(index, instant = false) {
        const destination = Math.max(0, Math.min(this.panels.length - 1, index));
        const distant = Math.abs(destination - this.index) > 3;

        // Repeated input advances from the requested release while scrolling catches up.
        // Do not restart a smooth scroll when a held key reaches the boundary.
        if (!instant && destination === this.destination) return;

        this.destination = destination;

        if (distant || instant) this.updateWindow(destination, this.viewport.clientWidth);

        this.viewport.scrollTo({
            left: destination * this.step,
            behavior: instant || this.reducedMotion.matches || distant ? 'instant' : 'smooth',
        });

        if (instant || this.reducedMotion.matches || distant) {
            this.paint();
            this.destination = null;
        }
    }

    updateWindow(index, width) {
        const radius = Math.ceil(width / this.step / 2) + 1;
        const start = Math.max(0, index - radius);
        const end = Math.min(this.panels.length - 1, index + radius);

        if (start === this.windowStart && end === this.windowEnd) return;

        // Preserve reading position and disclosures without retaining detached DOM trees.
        this.panels.forEach((panel, i) => {
            if (i >= start && i <= end) return;

            const content = panel.querySelector('.atlas-release-content');

            if (content) {
                this.panelState.set(i, {
                    top: content.scrollTop,
                    open: [...content.querySelectorAll('details')].map(detail => detail.open),
                });
            }
        });

        this.windowStart = start;
        this.windowEnd = end;
        this.dataset.windowStart = start;
        this.dataset.windowEnd = end;
        this.dispatchEvent(new Event('atlas-window'));
    }

    restorePanelState() {
        for (let i = this.windowStart; i <= this.windowEnd; i++) {
            const state = this.panelState.get(i);
            const content = this.panels[i].querySelector('.atlas-release-content');

            if (!state || !content) continue;

            content.querySelectorAll('details').forEach((detail, index) => {
                detail.open = state.open[index];
            });
            content.scrollTop = state.top;
            this.panelState.delete(i);
        }
    }

    keyboard(event) {
        if (event.target.matches('input, select, textarea, summary, a')) {
            return;
        }

        const index = this.destination ?? this.index;
        const destinations = {
            ArrowLeft: index - 1,
            ArrowRight: index + 1,
            Home: 0,
            End: this.panels.length - 1,
        };

        if (event.key in destinations) {
            event.preventDefault();

            // Release content can become inert or unmount as it leaves the viewport.
            if (this.viewport.contains(event.target)) {
                this.viewport.focus({ preventScroll: true });
            } else if (event.target.closest('.atlas-tick')) {
                const destination = Math.max(0, Math.min(this.panels.length - 1, destinations[event.key]));

                this.ticks[destination].focus({ preventScroll: true });
            }

            this.go(destinations[event.key]);
        }
    }

    bindDrag(element, timeline) {
        let drag = null;
        let suppressClick = false;

        this.listen(element, 'pointerdown', event => {
            if (event.button !== 0 || (!timeline && event.pointerType === 'touch')
                || event.target.closest('a, input, select, pre, code')) {
                return;
            }

            suppressClick = false;
            drag = { x: event.clientX, scroll: this.viewport.scrollLeft, moved: false };
        });
        this.listen(element, 'pointermove', event => {
            if (!drag) {
                return;
            }

            const distance = event.clientX - drag.x;

            if (Math.abs(distance) > 6) {
                drag.moved = true;
                element.setPointerCapture(event.pointerId);
                this.viewport.classList.add('is-dragging');
                this.viewport.scrollLeft = drag.scroll - distance * (timeline ? this.step / this.spacing : 1);
            }
        });
        const finish = event => {
            suppressClick = drag?.moved ?? false;
            drag = null;
            this.viewport.classList.remove('is-dragging');

            if (element.hasPointerCapture(event.pointerId)) {
                element.releasePointerCapture(event.pointerId);
            }
        };

        this.listen(element, 'pointerup', finish);
        this.listen(element, 'pointercancel', finish);
        this.listen(element, 'lostpointercapture', () => {
            drag = null;
            this.viewport.classList.remove('is-dragging');
        });
        this.listen(element, 'click', event => {
            if (suppressClick) {
                suppressClick = false;
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            const tick = event.target.closest('.atlas-tick');

            if (timeline && tick) {
                this.go(Number(tick.dataset.index));
            }
        }, { capture: true });
    }
}

customElements.define('release-atlas', ReleaseAtlas);
