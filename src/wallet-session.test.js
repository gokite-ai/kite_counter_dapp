import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRevisionGuard, findSavedWallet, getAnnouncedWallet, getWalletAccess,
  getWalletPreference, saveWalletPreference, selectKiteNetwork,
} from './wallet-session.js';

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

test('validates announcements and restores only an unambiguous wallet identity', () => {
  const provider = { request() {} };
  const info = { uuid: 'first-load', name: 'Example Wallet', rdns: 'app.example' };
  assert.equal(getAnnouncedWallet({ provider }), null);
  assert.equal(getAnnouncedWallet({ info, provider: {} }), null);

  const wallet = getAnnouncedWallet({ info, provider });
  const reloaded = getAnnouncedWallet({ info: { ...info, uuid: 'after-reload' }, provider });
  const preference = { key: wallet.key };
  assert.equal(findSavedWallet([reloaded], preference), reloaded);
  assert.equal(findSavedWallet([wallet, reloaded], preference), null);
  assert.equal(findSavedWallet([{ key: 'legacy' }], preference), null);
});

test('restoring wallet access uses only silent calls for the selected account and chain', async () => {
  const address = '0x' + '1'.repeat(40);
  const calls = [];
  const provider = { request: async ({ method }) => {
    calls.push(method);
    return method === 'eth_accounts' ? [address] : params.chainId;
  }};
  assert.equal(await getWalletAccess(provider, params.chainId), address);
  assert.deepEqual(calls, ['eth_accounts', 'eth_chainId']);
  assert.equal(await getWalletAccess(provider, '0x1'), null);
  provider.request = async ({ method }) => method === 'eth_accounts' ? [] : params.chainId;
  assert.equal(await getWalletAccess(provider, params.chainId), null);
});

test('blocked storage and invalid saved values leave the wallet disconnected', () => {
  assert.equal(getWalletPreference(() => ({ getItem: () => '{invalid' })), null);
  const blocked = () => { throw new Error('storage unavailable'); };
  assert.equal(getWalletPreference(blocked), null);
  assert.doesNotThrow(() => saveWalletPreference(blocked, null));
});

test('wallet artwork accepts embedded images and ignores remote or invalid sources', () => {
  const provider = { request() {} };
  const walletWithIcon = (icon) => getAnnouncedWallet({
    info: { uuid: 'wallet-id', name: 'Example Wallet', rdns: 'app.example', icon },
    provider,
  });

  for (const icon of ['data:image/png;base64,AA==', 'data:image/svg+xml,%3Csvg%2F%3E']) {
    assert.equal(walletWithIcon(icon).icon, icon);
  }
  for (const icon of ['https://example.com/wallet.png', 'javascript:alert(1)', 'data:text/html;base64,AA==',
    'data:image/png;base64,' + 'A'.repeat(128 * 1024), undefined]) {
    assert.equal(walletWithIcon(icon).icon, null);
  }
});
