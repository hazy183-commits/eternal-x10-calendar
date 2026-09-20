import test from 'node:test';
import assert from 'node:assert/strict';
import {avatarMarkup,prepareAvatar} from '../src/memberAvatars.js';
test('avatar initials and paths escape user supplied markup',()=>{
 const html=avatarMarkup({nickname:'<evil>',avatar_path:'" onerror="bad'});
 assert.match(html,/&lt;/);assert.match(html,/&quot;/);assert.doesNotMatch(html,/<evil|" onerror=/);
 assert.match(avatarMarkup({nickname:'żaba'}),/Ż/);
});
test('unsupported, empty and oversized uploads are rejected before image decoding',async()=>{
 await assert.rejects(prepareAvatar({type:'image/svg+xml',size:20}),/JPG/);
 await assert.rejects(prepareAvatar({type:'image/png',size:0}),/5 MB/);
 await assert.rejects(prepareAvatar({type:'image/jpeg',size:6*1024*1024}),/5 MB/);
});
