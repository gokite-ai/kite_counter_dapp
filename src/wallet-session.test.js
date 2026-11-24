import test from 'node:test';
import assert from 'node:assert/strict';
import { applySessionUpdate, createRevisionGuard, mayFinishAuthorization, selectKiteNetwork } from './wallet-session.js';

const params = { chainId: '0x940' };

test('session revisions invalidate stale asynchronous results', () => {
  const guard = createRevisionGuard();
  const previous = guard.capture();
  assert.equal(guard.isCurrent(previous), true);
  guard.invalidate();
  assert.equal(guard.isCurrent(previous), false);
});

test('adding a chain is followed by switching and verification', async () => {
  const calls = [];
  const wallet = { request: async ({ method }) => {
    calls.push(method);
    if (method === 'wallet_switchEthereumChain' && calls.length === 1) {
      throw { code: 4902 };
    }
    if (method === 'eth_chainId') return '0x940';
  }};
  await selectKiteNetwork(wallet, params);
  assert.deepEqual(calls, ['wallet_switchEthereumChain', 'wallet_addEthereumChain', 'wallet_switchEthereumChain', 'eth_chainId']);
});

test('rejects a wallet still on the wrong chain', async () => {
  const wallet = { request: async ({ method }) => method === 'eth_chainId' ? '0x1' : undefined };
  await assert.rejects(selectKiteNetwork(wallet, params), /not selected/);
});

test('propagates user rejection without attempting chain addition', async () => {
  const calls = [];
  const wallet = { request: async ({ method }) => { calls.push(method); throw { code: 4001 }; } };
  await assert.rejects(selectKiteNetwork(wallet, params));
  assert.deepEqual(calls, ['wallet_switchEthereumChain']);
});

test("stale wallet authorization cannot clear newer attempt", () => {
  assert.equal(mayFinishAuthorization(1, 2), false);
  assert.equal(mayFinishAuthorization(2, 2), true);
});

test('old transaction receipt cannot update the next wallet session', async () => {
  const guard = createRevisionGuard();
  const revisionA = guard.capture();
  const events = [];
  let confirm;
  const receipt = new Promise(resolve => { confirm = resolve; });
  const pending = (async () => {
    await receipt;
    return applySessionUpdate(guard, revisionA, () => events.push('A confirmed'));
  })();
  guard.invalidate(); // Account changed: wallet B is now active.
  events.push('B connected');
  confirm();
  assert.equal(await pending, false);
  assert.deepEqual(events, ['B connected']);
});

test('old RPC refresh and pending cleanup cannot overwrite new session', async () => {
  const guard = createRevisionGuard();
  const revisionA = guard.capture();
  const state = { count: '5', pending: 'increment', error: '' };
  guard.invalidate(); // Disconnect and connect as B.
  state.count = '20';
  state.pending = null;
  const writeCount = applySessionUpdate(guard, revisionA, () => { state.count = '6'; });
  const writeError = applySessionUpdate(guard, revisionA, () => { state.error = 'old RPC error'; });
  const clearPending = applySessionUpdate(guard, revisionA, () => { state.pending = null; });
  assert.deepEqual([writeCount, writeError, clearPending], [false, false, false]);
  assert.deepEqual(state, { count: '20', pending: null, error: '' });
  assert.equal(applySessionUpdate(guard, guard.capture(), () => { state.count = '21'; }), true);
  assert.equal(state.count, '21');
});
