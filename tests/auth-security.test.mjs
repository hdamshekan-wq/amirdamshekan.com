import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as redirects from '../lib/auth-redirect.ts';

for (const value of [undefined, null, '', 'https://evil.test', '//evil.test', '///evil.test', '/\\evil.test', '/\tevil.test', '/\nevil.test', '/%2fevil.test', '/%5cevil.test', '/%0devil.test', '/%00evil.test', '/%', '/a/..//evil.test', 'javascript:alert(1)', ' /account', new Blob(['x'])]) {
  test(`reject unsafe destination ${JSON.stringify(value)}`, () => assert.equal(redirects.safeAuthRedirect(value), '/account'));
}
for (const value of ['/', '/account', '/update-password', '/marinestruc/policy', '/account?tab=billing#invoice', '/account?next=https://example.com', '/a%20b']) {
  test(`preserve safe destination ${value}`, () => {
    // Encoded spaces are deliberately rejected by the strict validator.
    assert.equal(redirects.safeAuthRedirect(value), value === '/a%20b' ? '/account' : value);
  });
}
for (const value of [undefined, '', 'javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com', 'https://example.com/path', 'https://example.com?x=1', 'https://example.com#x', ' https://example.com', 'http://localhost:3000']) {
  test(`reject invalid production origin ${value}`, () => assert.throws(() => redirects.authSiteOrigin(value, true)));
}
test('configured preview and local origins', () => {
  assert.equal(redirects.authSiteOrigin('https://preview.example.com/', true), 'https://preview.example.com');
  assert.equal(redirects.authSiteOrigin(undefined, false), 'http://localhost:3000');
  assert.equal(redirects.authSiteOrigin('http://localhost:3001', false), 'http://localhost:3001');
});

function load(path, auth, env = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, URL, process: { env }, require(name) {
    if (name === '@/lib/auth-redirect') return redirects;
    if (name === '@/lib/supabase/server') return { createClient: async () => ({ auth }) };
    if (name === 'next/navigation') return { redirect: (url) => { throw Object.assign(new Error('redirect'), { url }); } };
    if (name === 'next/server') return { NextResponse: { redirect: (url) => url.href } };
    throw new Error(`Unexpected import: ${name}`);
  }});
  return exports;
}
const form = (next) => { const f = new FormData(); f.set('next', next); f.set('email', 'test@example.com'); return f; };
test('login validates submitted destination on success and failure; logout stays relative', async () => {
  for (const error of [null, { message: 'Invalid credentials' }]) {
    const actions = load('app/(auth)/login/actions.ts', { signInWithPassword: async () => ({ error }), signOut: async () => ({}) });
    await assert.rejects(actions.login(form('//evil.test')), e => error ? new URL(e.url, 'https://site.test').searchParams.get('next') === '/account' : e.url === '/account');
    await assert.rejects(actions.login(form('/account?tab=billing')), e => error ? new URL(e.url, 'https://site.test').searchParams.get('next') === '/account?tab=billing' : e.url === '/account?tab=billing');
    await assert.rejects(actions.logout(), e => e.url === '/');
  }
});
test('callback rejects external destinations and preserves recovery destination', async () => {
  for (const next of ['//evil.test', '/\\evil.test', '/%2fevil.test', '/a/..//evil.test', '/update-password']) {
    const route = load('app/auth/callback/route.ts', { exchangeCodeForSession: async () => ({ error: null }) });
    const url = new URL('https://site.test/auth/callback?code=test'); url.searchParams.set('next', next);
    assert.equal(await route.GET(new Request(url)), `https://site.test${next === '/update-password' ? next : '/account'}`);
  }
  const route = load('app/auth/callback/route.ts', { exchangeCodeForSession: async () => ({ error: {} }) });
  for (const query of ['', '?code=bad']) assert.match(await route.GET(new Request(`https://site.test/auth/callback${query}`)), /^https:\/\/site.test\/login\?error=/);
});
test('signup and reset email links use configured origin and fail closed without it', async () => {
  for (const [path, method, key, destination] of [
    ['signup', 'signup', 'emailRedirectTo', '/marinestruc/policy'],
    ['forgot-password', 'requestPasswordReset', 'redirectTo', '/update-password'],
  ]) {
    let link;
    const auth = { signUp: async (input) => { link = input.options[key]; return { error: null }; }, resetPasswordForEmail: async (_, options) => { link = options[key]; return { error: null }; } };
    const action = load(`app/(auth)/${path}/actions.ts`, auth, { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://preview.example.com' });
    await assert.rejects(action[method](form('/')), e => e.message === 'redirect');
    assert.equal(link, `https://preview.example.com/auth/callback?next=${destination}`);
    link = undefined;
    const invalid = load(`app/(auth)/${path}/actions.ts`, auth, { NODE_ENV: 'production' });
    await assert.rejects(invalid[method](form('/')), /NEXT_PUBLIC_SITE_URL/);
    assert.equal(link, undefined);
  }
});
