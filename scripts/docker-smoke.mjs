import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

const [image = 'caniuse-rs:local', ...args] = process.argv.slice(2);

assert.equal(args.length, 0, 'Expected one image reference');

const name = `caniuse-rs-smoke-${process.pid}`;
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8' });

async function request(base, path) {
    const response = await fetch(`${base}${path}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
    });

    assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);

    return response;
}

try {
    docker('run', '--detach', '--name', name, '--platform', 'linux/amd64',
        '--user', '10001:10001', '--read-only', '--cap-drop', 'ALL',
        '--cap-add', 'NET_BIND_SERVICE', '--security-opt', 'no-new-privileges',
        '--tmpfs', '/config:uid=10001,gid=10001,size=16m',
        '--tmpfs', '/data:uid=10001,gid=10001,size=16m',
        '--publish', '127.0.0.1::8080', image);

    const ports = JSON.parse(docker('inspect', name, '--format', '{{json .NetworkSettings.Ports}}'));
    const base = `http://127.0.0.1:${ports['8080/tcp'][0].HostPort}`;

    for (let attempt = 0; ; attempt += 1) {
        try {
            await request(base, '/index.html');
            break;
        } catch (error) {
            if (attempt === 29) throw error;
            await setTimeout(1000);
        }
    }

    const types = new Map([
        ['/index.html', ['text/html']],
        ['/caniuse_rs.js', ['text/javascript', 'application/javascript']],
        ['/caniuse_rs.wasm', ['application/wasm']],
        ['/features.json', ['application/json']],
    ]);

    for (const [path, expected] of types) {
        const response = await request(base, path);
        const type = response.headers.get('content-type')?.split(';')[0];
        const body = Buffer.from(await response.arrayBuffer());

        assert(expected.includes(type), `${path}: unexpected content type ${type}`);
        assert(body.length > 0, `${path}: empty response`);

        if (type === 'application/wasm') {
            assert.equal(body.subarray(0, 4).toString('hex'), '0061736d');
        }

        if (type === 'application/json') {
            JSON.parse(body.toString());
        }
    }

    const index = await request(base, '/index.html').then(response => response.text());
    const deepLink = await request(base, '/version/1.90').then(response => response.text());

    assert.equal(deepLink, index, 'SPA deep links must return the site index');

    console.log('Container smoke passed: non-root read-only startup, site assets, and SPA deep links.');
} catch (error) {
    try {
        process.stderr.write(docker('logs', name));
    } catch {}

    throw error;
} finally {
    try {
        docker('rm', '--force', name);
    } catch {}
}
