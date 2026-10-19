// Run in the browser console on an atlas page after data-ready becomes true.
(async () => {
    const atlas = document.querySelector('release-atlas');
    const original = atlas.index;
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const press = key => atlas.viewport.dispatchEvent(new KeyboardEvent('keydown', {
        key, bubbles: true, cancelable: true,
    }));
    const results = [];

    try {
        for (const keys of [
            ['ArrowRight', 'ArrowRight', 'ArrowRight'],
            ['ArrowRight', 'ArrowRight', 'ArrowLeft'],
            Array(8).fill('ArrowLeft'),
        ]) {
            atlas.go(54, true);
            atlas.viewport.focus({ preventScroll: true });

            for (const key of keys) {
                press(key);
                await wait(35);
            }

            await wait(1000);
            const expected = 54 + keys.reduce((sum, key) => sum + (key === 'ArrowRight' ? 1 : -1), 0);

            if (atlas.index !== expected) {
                throw new Error(`${keys.join(', ')}: expected ${expected}, got ${atlas.index}`);
            }

            results.push({ presses: keys.length, index: atlas.index });
        }

        atlas.go(54, true);
        await wait(250);
        atlas.panels[54].querySelector('.atlas-release-content').focus({ preventScroll: true });

        for (let i = 0; i < 3; i++) {
            document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'ArrowRight', bubbles: true, cancelable: true,
            }));
            await wait(700);
        }

        if (atlas.index !== 57 || document.activeElement !== atlas.viewport) {
            throw new Error('Navigation lost focus when release content moved offscreen');
        }

        results.push({ contentFocusRetained: true });

        return results;
    } finally {
        atlas.go(original, true);
    }
})()
