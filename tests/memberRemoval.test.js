import test from 'node:test';
import assert from 'node:assert/strict';
import {removeMember} from '../src/memberRemoval.js';
test('cancel leaves membership untouched',async()=>{
 let calls=0; const result=await removeMember({rpc:()=>{calls++;}},{id:'target',nickname:'Tester'},()=>false);
 assert.equal(result,false);assert.equal(calls,0);
});
test('confirmed removal calls guarded server operation',async()=>{
 let request; const result=await removeMember({rpc:async(...args)=>{request=args;return {error:null};}},{id:'target',nickname:'Tester'},message=>{assert.match(message,/Tester/);return true;});
 assert.equal(result,true);assert.deepEqual(request,['remove_clan_member',{target_id:'target'}]);
});
test('server errors remain visible to the caller',async()=>{
 await assert.rejects(removeMember({rpc:async()=>({error:{message:'Brak uprawnień'}})},{id:'target'},()=>true),/Brak uprawnień/);
});
