import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULT_ASCII, resolveAsciiPreference} from '../public/k-world/renderer.js';

test('Fresh visits default to ASCII', () => {
 assert.equal(DEFAULT_ASCII,true);
 assert.equal(resolveAsciiPreference(undefined),true);
});
test('Explicit saved display choices survive upgrades', () => {
 assert.equal(resolveAsciiPreference(false),false);
 assert.equal(resolveAsciiPreference(true),true);
});
test('Malformed or missing saved modes fall back to ASCII', () => {
 for (const value of [null,'false','true',0,1,[],{},NaN]) {
  assert.equal(resolveAsciiPreference(value),true);
 }
});
test('Both GPU and software renderers start with the same ASCII default', () => {
 const source=fs.readFileSync(new URL('../public/k-world/renderer.js',import.meta.url),'utf8');
 assert.equal(source.match(/this\.ascii=DEFAULT_ASCII/g)?.length,2);
 assert.doesNotMatch(source,/this\.ascii=false/);
});
