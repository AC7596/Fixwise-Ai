import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HOSTED_CHECKOUT_URL } from '../js/checkout-config.js';

const repoRoot = process.cwd();
const homepage = fs.readFileSync(path.resolve(repoRoot, 'index.html'), 'utf8');
const publicPages = ['index.html', 'terms.html', 'privacy.html', 'safety.html', 'contact.html', 'success.html'];

test('Branding rebrand regression checks', async (t) => {
  await t.test('homepage shows new brand, slogan, and family section copy', () => {
    assert.ok(homepage.includes('A to Z Wise AI'));
    assert.ok(homepage.includes('We\'ve got DIY covered.'));
    assert.ok(homepage.includes('Know what\'s wrong before you call a pro.'));
    assert.ok(homepage.includes('DIY Together'));
    assert.ok(homepage.includes('ZEE'));
  });

  await t.test('public pages use the custom domain and not the GitHub Pages URL', () => {
    for (const page of publicPages) {
      const content = fs.readFileSync(path.resolve(repoRoot, page), 'utf8');
      assert.ok(content.includes('https://atozwiseai.com'), `${page} should reference the custom domain`);
      assert.equal(content.includes('ac7596.github.io/Fixwise-Ai'), false, `${page} should not reference the GitHub Pages URL`);
    }
  });

  await t.test('old customer-facing FixWise branding is removed from public pages', () => {
    const disallowed = [
      '>FixWise AI<',
      '>FixWise Kids<',
      'Get FixWise Early Access',
      'Return to FixWise AI',
      'Back to FixWise AI',
      'Contact FixWise AI',
      'FIXWISE AI FOUNDING MEMBER',
      'Fixy says:',
      'Tap Fixy',
      'Fixy Helper'
    ];
    for (const page of publicPages) {
      const content = fs.readFileSync(path.resolve(repoRoot, page), 'utf8');
      for (const phrase of disallowed) {
        assert.equal(content.includes(phrase), false, `${page} should not contain ${phrase}`);
      }
    }
  });

  await t.test('PayPal hosted subscription URL remains unchanged', () => {
    const expectedUrl = 'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-3UR170892E856923CNKQ2DVI';
    assert.equal(HOSTED_CHECKOUT_URL, expectedUrl);
    assert.ok(homepage.includes(expectedUrl));
  });
});
