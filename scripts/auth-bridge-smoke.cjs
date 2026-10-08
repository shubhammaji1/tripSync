const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'apps/web/node_modules/typescript'));
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const effects = [], refs = [];
let cursor = 0, refCursor = 0, pending = [], registrations = 0, provider;
let auth = { isLoaded: true, userId: 'alice', sessionId: 'session-a', getToken: async () => 'first-token' };
const context = { exports: {}, require: name => {
  if (name === '@clerk/nextjs') return { useAuth: () => auth };
  if (name === '@/lib/offline') return { setOfflineUser: async () => {} };
  if (name === '@/lib/api') return { setApiAuthTokenProvider: value => { registrations++; provider = value; } };
  if (name === 'react') return {
    useRef: value => { const index = refCursor++; return refs[index] ||= { current: value }; },
    useEffect: (effect, deps) => {
      const index = cursor++, previous = effects[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) pending.push(() => {
        previous?.cleanup?.(); effects[index] = { deps, cleanup: effect() };
      });
    },
  };
  throw new Error(`Unexpected dependency: ${name}`);
} };
vm.runInNewContext(compile('apps/web/src/components/ApiAuthBridge.tsx'), context);
function render() { cursor = 0; refCursor = 0; pending = []; context.exports.ApiAuthBridge(); pending.forEach(effect => effect()); }
(async () => {
  render(); assert.equal(registrations, 1); assert.equal(await provider(), 'first-token');
  auth = { ...auth, getToken: async () => 'refreshed-token' };
  render(); assert.equal(registrations, 1, 'Token function refresh must not invalidate pending requests');
  assert.equal(await provider(), 'refreshed-token');
  auth = { ...auth, userId: 'bob', sessionId: 'session-b' };
  render(); assert.equal(registrations, 3, 'Account change must clear and replace the provider');
  auth = { ...auth, userId: null, sessionId: null };
  render(); assert.equal(registrations, 5, 'Sign-out must invalidate the previous account');
  let release, releaseBody;
  const apiContext = { exports: {}, require: () => ({ saveOfflineTrip: async () => {} }), process: { env: {} }, console: { warn: () => {} }, setTimeout: () => 0, AbortSignal,
    fetch: () => new Promise(resolve => { release = resolve; }) };
  vm.runInNewContext(compile('apps/web/src/lib/api.ts'), apiContext);
  const client = apiContext.exports;
  client.setApiAuthTokenProvider(async () => 'token-a', 'alice:session-a');
  const sameUser = client.api.getTrips();
  await new Promise(setImmediate);
  client.setApiAuthTokenProvider(async () => 'token-refreshed', 'alice:session-a');
  release({ ok: true, text: async () => '[]' });
  assert.equal((await sameUser).length, 0, 'Same-session token refresh must retain the response');
  const switchedUser = client.api.getTrips();
  const rejectedResponse = assert.rejects(switchedUser, /session changed/);
  await new Promise(setImmediate);
  release({ ok: true, text: () => new Promise(resolve => { releaseBody = resolve; }) });
  await new Promise(setImmediate);
  client.setApiAuthTokenProvider(async () => 'token-b', 'bob:session-b');
  releaseBody('[]');
  await rejectedResponse;
  console.log('Auth bridge regressions passed: token refresh, account change, sign-out.');
})().catch(error => { console.error(error); process.exitCode = 1; });
