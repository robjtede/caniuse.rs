// Run in the browser console on an atlas page after data-ready becomes true.
(async () => {
    const atlas = document.querySelector('release-atlas');
    const original = atlas.index;
    const wait = () => new Promise(resolve => setTimeout(resolve, 250));
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    let peakNodes = 0;
    let peakPanels = 0;

    try {
        for (const index of [0, 20, 54, 75, atlas.panels.length - 2, atlas.panels.length - 1]) {
            atlas.go(index, true);
            await wait();
            const mounted = atlas.querySelectorAll('.atlas-release-content').length;
            const radius = Math.ceil(atlas.viewport.clientWidth / atlas.step / 2) + 1;

            assert(mounted <= radius * 2 + 1, 'Release content is not bounded: ' + mounted);
            assert(atlas.panels[index].querySelector('.atlas-release-content'), 'Selected release is blank');
            assert(location.pathname === '/versions/' + atlas.panels[index].dataset.version
                && !location.hash, 'Release path does not match selection');

            const panel = atlas.panels[index].getBoundingClientRect();
            const viewport = atlas.viewport.getBoundingClientRect();

            assert(Math.abs(panel.left + panel.width / 2 - viewport.left - viewport.width / 2) < 1,
                'Selected release is not centered');
            peakPanels = Math.max(peakPanels, mounted);
            peakNodes = Math.max(peakNodes, atlas.querySelectorAll('*').length);
        }

        atlas.go(54, true);
        await wait();
        let content = atlas.panels[54].querySelector('.atlas-release-content');
        content.querySelector('details').open = true;
        content.scrollTop = 100;
        const top = content.scrollTop;
        atlas.go(0, true);
        await wait();
        assert(!atlas.panels[54].querySelector('.atlas-release-content'), 'Distant content was retained');
        atlas.go(54, true);
        await wait();
        content = atlas.panels[54].querySelector('.atlas-release-content');
        assert(content.querySelector('details').open, 'Disclosure state was lost');
        assert(Math.abs(content.scrollTop - top) < 1, 'Vertical reading position was lost');

        return { peakPanels, peakNodes, stateRestored: true };
    } finally {
        atlas.go(original, true);
    }
})()
