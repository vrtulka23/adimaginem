import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareTours, filterTours, seedTourPositions } from './guided_tours.mjs';

function fixture() {
  return {
    ontology: {concepts:{a:{},b:{}},edges:{ab:{subject:'a',object:'b'}},sources:{source:{}}},
    graph_tours: {tour:{title:'Title',description:'Description',framing_note:'Scope',audience_tags:['General introduction'],topic_tags:['Topic'],step_ids:['first'],review_status:'draft'}},
    graph_tour_steps: {first:{tour_id:'tour',title:'Step',question:'Question',narrative:'Cited explanation',qualification:'Qualification',source_ids:['source'],concept_ids:['a','b'],edge_ids:['ab'],highlighted_concept_ids:['a'],highlighted_edge_ids:['ab'],focus_concept:'a',camera_x:0,camera_y:0,camera_z:20,look_at_x:0,look_at_y:0,look_at_z:0}},
    graph_tour_positions: {a:{step_id:'first',concept_id:'a',x:-4,y:0,z:0},b:{step_id:'first',concept_id:'b',x:4,y:0,z:0}},
  };
}
test('tour scenes preserve authored IDs, coordinates, and user-selected audience filtering', () => {
  const data=fixture(), result=prepareTours(data);
  assert.deepEqual(result.scenes.first.positions,{a:[-4,0,0],b:[4,0,0]});
  assert.deepEqual([...result.scenes.first.edgeIds],['ab']);
  assert.deepEqual([...result.scenes.first.highlightedConceptIds],['a']);
  assert.ok(result.scenes.first.conceptIds.has('b'));
  assert.ok(!result.scenes.first.highlightedConceptIds.has('b'));
  assert.equal(filterTours(result.tours).length,1);
  assert.equal(filterTours(result.tours,{audience:'General introduction'}).length,1);
  assert.equal(filterTours(result.tours,{audience:'Unknown audience'}).length,0);
  assert.equal(filterTours(result.tours,{topic:'Topic'}).length,1);
  assert.equal(filterTours(result.tours,{audience:'General introduction',topic:'Topic'}).length,1);
  assert.equal(filterTours(result.tours,{audience:'General introduction',topic:'Missing'}).length,0);
});
test('invalid source, scene membership, camera, and coordinate references are rejected', () => {
  const mutations=[
    d=>d.graph_tour_steps.first.source_ids=['missing'],
    d=>d.ontology.edges.ab.object='outside',
    d=>delete d.graph_tour_positions.a,
    d=>d.graph_tour_positions.copy={...d.graph_tour_positions.a},
    d=>d.graph_tour_positions.a.x=Infinity,
    d=>d.graph_tour_steps.first.focus_concept='outside',
    d=>d.graph_tour_steps.first.focus_concept='b',
    d=>d.graph_tour_steps.first.highlighted_concept_ids=['outside'],
    d=>d.graph_tour_steps.first.highlighted_edge_ids=['missing'],
    d=>{d.ontology.concepts.c={};d.graph_tour_steps.first.concept_ids.push('c');d.graph_tour_positions.c={step_id:'first',concept_id:'c',x:0,y:4,z:0};},
    d=>d.graph_tour_steps.first.camera_z=0,
    d=>d.graph_tours.tour.step_ids=['first','first'],
    d=>d.graph_tour_steps.extra={...d.graph_tour_steps.first},
  ];
  for(const mutate of mutations) {const data=fixture();mutate(data);assert.throws(()=>prepareTours(data),/Guided tours:/);}
});

test('planar tour coordinates seed a reproducible volume without changing authored data', () => {
  const positions = {a:[-5,-5,0],b:[5,-5,0],c:[5,5,0],d:[-5,5,0]};
  const scene = {conceptIds:new Set(Object.keys(positions)),positions};
  const original = structuredClone(positions);
  const seeded = seedTourPositions(scene, 9);
  assert.deepEqual(positions, original);
  assert.deepEqual(seedTourPositions(scene, 0), positions);
  assert.deepEqual(seedTourPositions({...scene,conceptIds:new Set(['d','c','b','a'])},9), seeded);
  const [a,b,c,d] = Object.values(seeded);
  const subtract = (p,q) => p.map((v,i)=>v-q[i]);
  const [u,v,w] = [subtract(b,a),subtract(c,a),subtract(d,a)];
  const volume = u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]);
  assert.ok(Math.abs(volume)>0.001, 'four planar nodes must begin noncoplanar');
  assert.ok(Math.abs(Object.values(seeded).reduce((sum,p)=>sum+p[2],0))<1e-10);
});
