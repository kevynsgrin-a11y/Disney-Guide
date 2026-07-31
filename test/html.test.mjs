import { test } from 'node:test'
import assert from 'node:assert/strict'

import { html, raw, escapeHtml, inline, paragraphs, plain, truncate, each, cx, attrs } from '../src/lib/html.mjs'

const s = (value) => String(value)

test('html escapes every interpolated value by default', () => {
  assert.equal(s(html`<p>${'<script>alert(1)</script>'}</p>`), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  assert.equal(s(html`<p title="${'" onload="x'}">`), '<p title="&quot; onload=&quot;x">')
  assert.equal(s(html`${"it's"}`), 'it&#39;s')
})

test('raw() and nested html templates pass through unescaped', () => {
  assert.equal(s(html`${raw('<b>hi</b>')}`), '<b>hi</b>')
  assert.equal(s(html`<div>${html`<i>${'a&b'}</i>`}</div>`), '<div><i>a&amp;b</i></div>')
})

test('arrays join with no separator and falsy values render empty', () => {
  assert.equal(s(html`${[1, 2, 3].map((n) => html`<li>${n}</li>`)}`), '<li>1</li><li>2</li><li>3</li>')
  assert.equal(s(html`${null}${undefined}${false}${true}x`), 'x')
  assert.equal(s(html`${0}`), '0', 'zero must render, unlike other falsy values')
})

test('each() maps to trusted markup', () => {
  assert.equal(s(each(['a', 'b'], (v) => html`<i>${v}</i>`)), '<i>a</i><i>b</i>')
  assert.equal(s(each(null, () => 'x')), '')
})

test('inline markdown supports exactly the documented subset', () => {
  assert.equal(s(inline('a **b** c')), 'a <strong>b</strong> c')
  assert.equal(s(inline('a *b* c')), 'a <em>b</em> c')
  assert.equal(s(inline('use `x` now')), 'use <code>x</code> now')
  assert.equal(s(inline('see [here](/a/b/)')), 'see <a href="/a/b/">here</a>')
  assert.equal(
    s(inline('see [x](https://e.com)')),
    'see <a href="https://e.com" rel="noopener" target="_blank">x</a>',
    'external links get rel=noopener'
  )
})

test('inline markdown escapes before it transforms', () => {
  assert.equal(s(inline('<b>**x**</b>')), '&lt;b&gt;<strong>x</strong>&lt;/b&gt;')
  assert.equal(s(inline('[click](javascript:alert)')), 'click', 'unsafe schemes fall back to plain text')
  assert.equal(
    s(inline('[click](javascript:alert(1\u0029)')),
    'click)',
    'link targets do not support nested parens; the dangerous href is still dropped, only a stray bracket survives'
  )
  assert.equal(s(inline('[x](data:text/html,<script>)')), 'x')
  assert.equal(s(inline('[x](//evil.test)')), 'x', 'protocol-relative URLs are not treated as internal')
  assert.equal(s(inline('[x](mailto:a@b.test)')), '<a href="mailto:a@b.test">x</a>')
  assert.equal(s(inline('`<img onerror=x>`')), '<code>&lt;img onerror=x&gt;</code>')
})

test('inline markdown does not italicise mid-word asterisks', () => {
  assert.equal(s(inline('a*b*c')), 'a*b*c')
  assert.equal(s(inline('2 * 3 * 4')), '2 * 3 * 4')
})

test('paragraphs renders one <p> per entry and drops empties', () => {
  assert.equal(s(paragraphs(['a', 'b'])), '<p>a</p><p>b</p>')
  assert.equal(s(paragraphs(['a', '', null, 'b'])), '<p>a</p><p>b</p>')
  assert.equal(s(paragraphs([])), '')
  assert.equal(s(paragraphs(null)), '')
})

test('plain strips markdown and collapses whitespace', () => {
  assert.equal(plain('**a** [b](/c) `d`'), 'a b d')
  assert.equal(plain('a\n\n  b'), 'a b')
  assert.equal(plain(null), '')
})

test('truncate only adds an ellipsis when it actually cuts', () => {
  assert.equal(truncate('hello', 20), 'hello')
  const cut = truncate('the quick brown fox jumps over the lazy dog', 20)
  assert.ok(cut.endsWith('…'))
  assert.ok(cut.length <= 20)
})

test('cx and attrs build attribute values safely', () => {
  assert.equal(cx('a', false, ['b', null], { c: true, d: false }), 'a b c')
  assert.equal(s(attrs({ a: '1', b: false, c: true, d: null })), ' a="1" c')
  assert.equal(s(attrs({ x: '"><script>' })), ' x="&quot;&gt;&lt;script&gt;"')
})

test('escapeHtml covers all five characters', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;')
})
