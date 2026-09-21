import test from 'node:test';import assert from 'node:assert/strict';import{startsNewVisit,VISIT_GAP_MS}from '../src/siteVisitStats.js';
test('page refresh stays in the same visit for thirty minutes',()=>{const now=2000000000;assert.equal(startsNewVisit(String(now-1000),now),false);assert.equal(startsNewVisit(String(now-VISIT_GAP_MS+1),now),false);assert.equal(startsNewVisit(String(now-VISIT_GAP_MS),now),true);});
test('first visit, invalid storage and clock rollback start a visit',()=>{for(const last of [null,'invalid','0','3000000000'])assert.equal(startsNewVisit(last,2000000000),true);});
