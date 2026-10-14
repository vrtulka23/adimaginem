// Evidence is attached to an exact claim and target, never inherited across an edge.
export const groundingLabels = {natural_reason:'Natural reason',divine_revelation:'Divine revelation',reasoning_from_revelation:'Reasoning from revelation',unassessed:'Unassessed'};
export const witnessLabels = {scripture:'Scripture',ancient_philosophy:'Ancient philosophy',patristic:'Patristic writing',scholastic:'Scholastic writing',magisterial:'Magisterial document',ecclesial_guidance:'Ecclesial guidance or discipline',pastoral_literature:'Pastoral literature',unassessed:'Unassessed'};
export const supportLabels = {explicit_statement:'Explicit statement',philosophical_argument:'Philosophical argument',theological_inference:'Theological inference',typological_interpretation:'Typological interpretation',doctrinal_formulation:'Doctrinal formulation',terminology_only:'Terminology only',editorial_classification:'Editorial classification'};
export const statusLabels = {unassessed:'Doctrinal standing unassessed',defined_doctrine:'Defined doctrine',magisterial_teaching:'Magisterial teaching',theological_opinion:'Theological opinion',pastoral_terminology:'Pastoral terminology',editorial:'Editorial'};
export function prepareSupport(data) {
  const {concepts,edges,sources,support_records={}}=data.ontology;
  const index={concept:new Map(),edge:new Map()};
  const fail=message=>{throw new Error(`Source support: ${message}`);};
  for(const [id,source] of Object.entries(sources)) {
    if(source.witness_kind && !witnessLabels[source.witness_kind]) fail(`invalid witness ${id}`);
    if(source.witness_kind==='scripture'||source.authority_kind==='scripture') {
      if(source.witness_kind!=='scripture'||source.authority_kind!=='scripture'||!source.biblical_book?.trim()||!source.translation?.trim()||
        ![source.biblical_chapter,source.verse_start,source.verse_end].every(n=>Number.isInteger(n)&&n>0)||source.verse_end<source.verse_start) fail(`invalid biblical locator ${id}`);
    }
  }
  for(const [id,r] of Object.entries(support_records)) {
    if(!index[r.target_kind]||!(r.target_kind==='concept'?concepts:edges)[r.target_id])fail(`unknown target ${id}`);
    if(!sources[r.source_id])fail(`unknown source ${id}`);
    if(!Array.isArray(r.grounding)||!r.grounding.length||new Set(r.grounding).size!==r.grounding.length||r.grounding.some(g=>!groundingLabels[g])||(r.grounding.length>1&&r.grounding.includes('unassessed')))fail(`invalid grounding ${id}`);
    if(!supportLabels[r.support_kind]||!statusLabels[r.doctrinal_status]||!['draft','reviewed','contested'].includes(r.review_status))fail(`invalid classification ${id}`);
    if(!r.claim?.trim()||!r.qualification?.trim()||!data.support_rationales?.[id]?.trim())fail(`missing claim, qualification or rationale ${id}`);
    if((r.doctrinal_status!=='unassessed'||r.status_source_id)&&!sources[r.status_source_id])fail(`status source missing ${id}`);
    if(['defined_doctrine','magisterial_teaching'].includes(r.doctrinal_status)&&sources[r.status_source_id]?.authority_kind!=='church_teaching')fail(`magisterial source missing ${id}`);
    if(!index[r.target_kind].has(r.target_id))index[r.target_kind].set(r.target_id,[]);
    index[r.target_kind].get(r.target_id).push({id,...r});
  }
  for(const id of Object.keys(data.support_rationales||{}))if(!support_records[id])fail(`orphan rationale ${id}`);
  return index;
}
export function matchesSupport(data,index,kind,id,{grounding='',witness='',support=''}={}) {
  const records=index[kind].get(id)||[];
  const assessed=records.some(r=>r.grounding.some(g=>g!=='unassessed'));
  if(grounding==='unassessed'&&assessed)return false;
  const target=data.ontology[kind==='concept'?'concepts':'edges'][id];
  // The existing citation is a historical witness even before its epistemic
  // grounding is assessed. Its source type never assigns grounding to a claim.
  const candidates=[...records,{source_id:target.source_id,grounding:['unassessed']}];
  return candidates.some(r=>(!grounding||(grounding==='unassessed'&&!assessed)||r.grounding.includes(grounding))&&
    (!witness||(data.ontology.sources[r.source_id]?.witness_kind||'unassessed')===witness)&&
    (!support||r.support_kind===support));
}
export function filterSupportGraph(data,index,filters) {
  if(!Object.values(filters).some(Boolean))return {conceptIds:null,edgeIds:null};
  const conceptIds=new Set(Object.keys(data.ontology.concepts).filter(id=>matchesSupport(data,index,'concept',id,filters)));
  const edgeIds=new Set(Object.keys(data.ontology.edges).filter(id=>matchesSupport(data,index,'edge',id,filters)));
  for(const id of edgeIds){const e=data.ontology.edges[id];conceptIds.add(e.subject);conceptIds.add(e.object);}
  return {conceptIds,edgeIds};
}
