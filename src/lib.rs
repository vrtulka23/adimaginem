use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Source {
    pub author: String,
    pub work: String,
    pub locator: String,
    pub url: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Concept {
    pub label: String,
    pub latin_name: String,
    pub domain: String,
    pub category: String,
    pub note: String,
    pub source_id: String,
    pub review_status: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Edge {
    pub subject: String,
    pub relation: String,
    pub object: String,
    pub source_id: String,
    pub evidence_kind: String,
    pub review_status: String,
    pub included_in_model: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Ontology {
    pub concepts: BTreeMap<String, Concept>,
    pub sources: BTreeMap<String, Source>,
    pub edges: BTreeMap<String, Edge>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Input {
    pub ontology: Ontology,
    pub rationales: BTreeMap<String, String>,
}

#[derive(Debug, Serialize)]
pub struct CitedEdge<'a> {
    pub id: &'a str,
    pub edge: &'a Edge,
    pub rationale: &'a str,
    pub source: &'a Source,
}

impl Input {
    pub fn validate(&self) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        let ontology = &self.ontology;
        for (id, source) in &ontology.sources {
            if id.is_empty() || source.author.trim().is_empty() || source.work.trim().is_empty()
                || source.locator.trim().is_empty() || source.url.trim().is_empty()
            {
                errors.push(format!("source {id}: incomplete citation"));
            }
        }
        for (id, concept) in &ontology.concepts {
            if id.is_empty() || concept.label.trim().is_empty() || concept.latin_name.trim().is_empty()
                || concept.note.trim().is_empty()
            {
                errors.push(format!("concept {id}: incomplete definition"));
            }
            if !ontology.sources.contains_key(&concept.source_id) {
                errors.push(format!("concept {id}: unknown source {}", concept.source_id));
            }
        }
        for (id, edge) in &ontology.edges {
            if !ontology.concepts.contains_key(&edge.subject) {
                errors.push(format!("edge {id}: unknown subject {}", edge.subject));
            }
            if !ontology.concepts.contains_key(&edge.object) {
                errors.push(format!("edge {id}: unknown object {}", edge.object));
            }
            if !ontology.sources.contains_key(&edge.source_id) {
                errors.push(format!("edge {id}: unknown source {}", edge.source_id));
            }
            if self.rationales.get(id).map_or(true, |text| text.trim().is_empty()) {
                errors.push(format!("edge {id}: missing source rationale"));
            }
        }
        for id in self.rationales.keys() {
            if !ontology.edges.contains_key(id) {
                errors.push(format!("rationale {id}: unknown edge"));
            }
        }
        if errors.is_empty() { Ok(()) } else { Err(errors) }
    }

    pub fn cited_edges(&self, concept: &str, relation: Option<&str>) -> Vec<CitedEdge<'_>> {
        self.ontology.edges.iter().filter_map(|(id, edge)| {
            if !edge.included_in_model || edge.subject != concept
                || relation.is_some_and(|name| name != edge.relation.as_str()) {
                return None;
            }
            Some(CitedEdge {
                id,
                edge,
                rationale: self.rationales.get(id)?.as_str(),
                source: self.ontology.sources.get(&edge.source_id)?,
            })
        }).collect()
    }
}
