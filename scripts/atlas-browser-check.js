// Run in the browser console on an atlas page after data-ready becomes true.
(async () => {
    const atlas = document.querySelector('release-atlas');
    const original = atlas.viewport.scrollLeft;
    const samples = [];
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.length; });

    atlas.paint();
    observer.observe(atlas, { subtree: true, attributes: true, childList: true });

    for (let i = 0; i < 10; i++) {
        atlas.paint();
        await Promise.resolve();
    }

    observer.disconnect();

    for (let i = 0; i < 90; i++) {
        await new Promise(requestAnimationFrame);
        atlas.viewport.scrollLeft = (54 + i / 90 * 4) * atlas.step;
        const start = performance.now();
        atlas.paint();
        samples.push(performance.now() - start);
    }

    atlas.viewport.scrollLeft = original;
    atlas.paint();
    samples.sort((a, b) => a - b);

    const result = {
        idleMutations: mutations,
        meanPaintMs: samples.reduce((a, b) => a + b) / samples.length,
        p95PaintMs: samples[Math.floor(samples.length * .95)],
    };

    if (mutations > 0) {
        throw new Error('Unchanged scroll frames rewrite the DOM: ' + JSON.stringify(result));
    }

    return result;
})()
