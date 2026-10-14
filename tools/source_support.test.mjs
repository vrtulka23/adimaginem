import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSupport, matchesSupport, filterSupportGraph} from './source_support.mjs';

function fixture() {
  const record = {target_kind:'concept', target_id:'a', claim:'A bounded claim', source_id:'thomas',
    grounding:['natural_reason'], support_kind:'philosophical_argument', doctrinal_status:'unassessed',
    qualification:'Only this argument is assessed.', review_status:'draft'};
  return {ontology:{concepts:{a:{source_id:'thomas'},b:{source_id:'bible'}},
    edges:{ab:{subject:'a',object:'b',source_id:'thomas'}},
    sources:{thomas:{authority_kind:'thomistic_text',witness_kind:'scholastic'},
      bible:{authority_kind:'scripture',witness_kind:'scripture',biblical_book:'John',biblical_chapter:1,verse_start:1,verse_end:3,translation:'Identified edition'}},
    support_records:{reason:record, revelation:{...record,source_id:'bible',grounding:['divine_revelation'],support_kind:'explicit_statement'}}},
    support_rationales:{reason:'An argument',revelation:'A biblical witness'}};
}

test('combined filters must be satisfied by the same support record',()=>{
  const data=fixture(),index=prepareSupport(data);
  assert.equal(matchesSupport(data,index,'concept','a',{grounding:'natural_reason',witness:'scholastic'}),true);
  assert.equal(matchesSupport(data,index,'concept','a',{grounding:'natural_reason',witness:'scripture'}),false);
  assert.equal(matchesSupport(data,index,'concept','a',{grounding:'divine_revelation',support:'philosophical_argument'}),false);
});

test('source type alone never assigns grounding; assessments do not propagate',()=>{
  const data=fixture(),index=prepareSupport(data);
  assert.equal(matchesSupport(data,index,'concept','b',{grounding:'divine_revelation'}),false);
  assert.equal(matchesSupport(data,index,'concept','b',{grounding:'unassessed',witness:'scripture'}),true);
  assert.equal(matchesSupport(data,index,'concept','a',{grounding:'unassessed'}),false);
  const result=filterSupportGraph(data,index,{grounding:'natural_reason'});
  assert.deepEqual([...result.conceptIds],['a']);
  assert.equal(result.edgeIds.size,0);
  assert.deepEqual(filterSupportGraph(data,index,{}),{conceptIds:null,edgeIds:null});
});

test('matched relations retain their endpoints as context without transferring evidence',()=>{
  const data=fixture();
  data.ontology.support_records.reason.target_kind='edge';
  data.ontology.support_records.reason.target_id='ab';
  const index=prepareSupport(data),result=filterSupportGraph(data,index,{grounding:'natural_reason'});
  assert.deepEqual([...result.edgeIds],['ab']);
  assert.deepEqual([...result.conceptIds],['a','b']);
  assert.equal(matchesSupport(data,index,'concept','b',{grounding:'natural_reason'}),false);
});

test('invalid citations, locators, classifications and unsupported grades are rejected',()=>{
  const cases=[
    d=>{d.ontology.support_records.reason.target_id='missing';},
    d=>{d.ontology.support_records.reason.source_id='missing';},
    d=>{d.ontology.support_records.reason.grounding=['natural_reason','unassessed'];},
    d=>{d.ontology.support_records.reason.grounding=['natural_reason','natural_reason'];},
    d=>{d.ontology.sources.bible.verse_end=0;},
    d=>{d.ontology.sources.bible.translation='';},
    d=>{d.support_rationales.reason='';},
    d=>{d.support_rationales.orphan='Unknown record';},
    d=>{Object.assign(d.ontology.support_records.reason,{doctrinal_status:'defined_doctrine',status_source_id:'thomas'});},
  ];
  for(const change of cases){const data=fixture();change(data);assert.throws(()=>prepareSupport(data),/Source support:/);}
});
