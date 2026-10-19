// Open /versions/1.57, then run this in the browser console.
(async () => {
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const waitFor = async predicate => {
        const deadline = performance.now() + 3000;

        while (!predicate()) {
            assert(performance.now() < deadline, 'Timed out at ' + location.pathname + location.hash);
            await new Promise(resolve => setTimeout(resolve, 25));
        }
    };
    const select = document.querySelector('#atlas-release');

    assert(select?.value === '1.57', 'The release permalink did not select Rust 1.57');
    select.value = '1.88';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => location.pathname === '/versions/1.88' && !location.hash);
    assert(select.value === '1.88', 'The path and selected release disagree');

    for (const channel of ['beta', 'unstable']) {
        select.value = channel;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await waitFor(() => location.pathname === '/versions/' + channel && !location.hash);
        assert(document.querySelector('release-atlas'), 'The channel route did not keep the atlas');
    }

    const input = document.querySelector('#query');

    input.value = 'let chains';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => location.pathname === '/' && document.querySelector('.search-results'));
    const feature = document.querySelector('.feature-list a.title');

    assert(feature, 'Search did not find the feature');
    feature.click();
    await waitFor(() => location.pathname.startsWith('/features/'));
    history.back();
    await waitFor(() => location.pathname === '/' && document.querySelector('.search-results'));
    assert(input.value === 'let chains', 'Returning to search lost the query');
    history.back();
    await waitFor(() => location.pathname === '/versions/unstable'
        && document.querySelector('#atlas-release')?.value === 'unstable');
    history.forward();
    await waitFor(() => location.pathname === '/' && document.querySelector('.search-results'));

    return { stablePath: true, channelPaths: true, searchReturn: true, backForward: true };
})()
