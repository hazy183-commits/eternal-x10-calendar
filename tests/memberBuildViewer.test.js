import test from 'node:test';
import assert from 'node:assert/strict';
import {memberBuildContent,loadoutPreview,buffPreview} from '../src/memberBuildViewer.js';
test('member equipment preview contains individual jewelry enchants and augmentation, with no editor',()=>{
 const html=loadoutPreview({class_name:'Duelist',equipment:{weapon:'Arcana Mace · Acumen',weaponEnchant:10,armor:'Tallum Heavy',armorEnchant:6,jewelry:{ring1:{itemId:6658,enchant:7},ring2:{itemId:6660,enchant:8}},augmentation:'Empower · Pasywna · Lv. 7'}},0);
 assert.match(html,/Ring of Baium \+7/);assert.match(html,/Ring of Queen Ant \+8/);assert.match(html,/Empower/);assert.match(html,/armor_t77_ul_i00/);assert.doesNotMatch(html,/<input|<select|data-save|data-delete/);
});
test('buff viewer reuses icons and shows symbols without allowing editing',()=>{
 const html=buffPreview({title:'PvP',buffs:['Haste','Might'],symbols:'+4 STR / -4 CON'});
 assert.match(html,/skill1086.png/);assert.match(html,/\+4 STR/);assert.doesNotMatch(html,/<input|data-edit|data-delete/);
});
test('untrusted names are escaped, empty states and legacy equipment remain readable',()=>{
 const html=memberBuildContent({character_class:'<script>bad</script>',subclass:'Titan'},[],[]);
 assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Titan/);assert.match(html,/Brak zapisanych/);
 assert.match(loadoutPreview({class_name:'Duelist',equipment:{fullEpic:true,jewelsEnchant:6}},0),/Full Epic \+6/);
});
