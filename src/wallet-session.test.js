import test from 'node:test';
import assert from 'node:assert/strict';
import { createRevisionGuard, mayFinishAuthorization, selectKiteNetwork } from './wallet-session.js';

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
