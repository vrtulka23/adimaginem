use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Source {
    pub authority_kind: String,
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
pub struct Relation {
    pub label: String,
    pub kind: String,
    pub description: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct PassionProfile {
    pub concept_id: String,
    pub appetite_id: String,
    pub object_aspect: String,
    pub arduous: bool,
    pub phase: String,
    pub temporal_relation: String,
    pub evidence_kind: String,
    pub review_status: String,
    pub source_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Ontology {
    pub concepts: BTreeMap<String, Concept>,
    pub sources: BTreeMap<String, Source>,
    pub edges: BTreeMap<String, Edge>,
    pub relations: BTreeMap<String, Relation>,
    pub passion_profiles: BTreeMap<String, PassionProfile>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Input {
    pub ontology: Ontology,
    pub rationales: BTreeMap<String, String>,
    pub profile_rationales: BTreeMap<String, String>,
}

#[derive(Debug, Serialize)]
pub struct CitedEdge<'a> {
    pub id: &'a str,
    pub edge: &'a Edge,
    pub rationale: &'a str,
    pub source: &'a Source,
}

#[derive(Debug, Serialize)]
pub struct CitedPassionProfile<'a> {
    pub id: &'a str,
    pub profile: &'a PassionProfile,
    pub rationale: &'a str,
    pub source: &'a Source,
}

impl Input {
    pub fn validate(&self) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        let ontology = &self.ontology;
        for (id, source) in &ontology.sources {
            if id.is_empty()
                || source.author.trim().is_empty()
                || source.work.trim().is_empty()
                || source.locator.trim().is_empty()
                || source.url.trim().is_empty()
            {
                errors.push(format!("source {id}: incomplete citation"));
            }
        }
        for (id, concept) in &ontology.concepts {
            if id.is_empty()
                || concept.label.trim().is_empty()
                || concept.latin_name.trim().is_empty()
                || concept.note.trim().is_empty()
            {
                errors.push(format!("concept {id}: incomplete definition"));
            }
            if !ontology.sources.contains_key(&concept.source_id) {
                errors.push(format!(
                    "concept {id}: unknown source {}",
                    concept.source_id
                ));
            }
        }
        for (id, edge) in &ontology.edges {
            if !ontology.relations.contains_key(&edge.relation) {
                errors.push(format!("edge {id}: unknown relation {}", edge.relation));
            }
            if edge.relation == "creates" && edge.subject != "god" {
                errors.push(format!("edge {id}: only God may be the subject of creates"));
            }
            if !ontology.concepts.contains_key(&edge.subject) {
                errors.push(format!("edge {id}: unknown subject {}", edge.subject));
            }
            if !ontology.concepts.contains_key(&edge.object) {
                errors.push(format!("edge {id}: unknown object {}", edge.object));
            }
            if !ontology.sources.contains_key(&edge.source_id) {
                errors.push(format!("edge {id}: unknown source {}", edge.source_id));
            }
            if self
                .rationales
                .get(id)
                .map_or(true, |text| text.trim().is_empty())
            {
                errors.push(format!("edge {id}: missing source rationale"));
            }
        }
        for (id, relation) in &ontology.relations {
            if id.is_empty()
                || relation.label.trim().is_empty()
                || relation.description.trim().is_empty()
            {
                errors.push(format!("relation {id}: incomplete definition"));
            }
        }
        for id in self.rationales.keys() {
            if !ontology.edges.contains_key(id) {
                errors.push(format!("rationale {id}: unknown edge"));
            }
        }
        for (id, profile) in &ontology.passion_profiles {
            if profile.concept_id != *id {
                errors.push(format!(
                    "passion profile {id}: concept ID differs from map key"
                ));
            }
            if ontology
                .concepts
                .get(&profile.concept_id)
                .map(|concept| concept.category.as_str())
                != Some("passion")
            {
                errors.push(format!("passion profile {id}: unknown passion concept"));
            }
            if !ontology.concepts.contains_key(&profile.appetite_id) {
                errors.push(format!(
                    "passion profile {id}: unknown appetite {}",
                    profile.appetite_id
                ));
            }
            if !ontology.sources.contains_key(&profile.source_id) {
                errors.push(format!(
                    "passion profile {id}: unknown source {}",
                    profile.source_id
                ));
            }
            if self
                .profile_rationales
                .get(id)
                .map_or(true, |text| text.trim().is_empty())
            {
                errors.push(format!("passion profile {id}: missing rationale"));
            }
            if !ontology.edges.values().any(|edge| {
                edge.subject == *id
                    && edge.relation == "is_passion_of"
                    && edge.object == profile.appetite_id
            }) {
                errors.push(format!(
                    "passion profile {id}: appetite disagrees with ontology edges"
                ));
            }
        }
        for id in self.profile_rationales.keys() {
            if !ontology.passion_profiles.contains_key(id) {
                errors.push(format!("passion profile rationale {id}: unknown profile"));
            }
        }
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    pub fn cited_edges(&self, concept: &str, relation: Option<&str>) -> Vec<CitedEdge<'_>> {
        self.ontology
            .edges
            .iter()
            .filter_map(|(id, edge)| {
                if !edge.included_in_model
                    || edge.subject != concept
                    || relation.is_some_and(|name| name != edge.relation.as_str())
                {
                    return None;
                }
                Some(CitedEdge {
                    id,
                    edge,
                    rationale: self.rationales.get(id)?.as_str(),
                    source: self.ontology.sources.get(&edge.source_id)?,
                })
            })
            .collect()
    }

    pub fn cited_passion_profile(&self, id: &str) -> Option<CitedPassionProfile<'_>> {
        let (key, profile) = self.ontology.passion_profiles.get_key_value(id)?;
        Some(CitedPassionProfile {
            id: key,
            profile,
            rationale: self.profile_rationales.get(id)?,
            source: self.ontology.sources.get(&profile.source_id)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_reference_and_missing_rationale_are_rejected() {
        let mut input = Input {
            ontology: Ontology {
                concepts: BTreeMap::from([(
                    "person".into(),
                    Concept {
                        label: "Person".into(),
                        latin_name: "persona".into(),
                        domain: "anthropology".into(),
                        category: "person".into(),
                        note: "A cited concept".into(),
                        source_id: "source".into(),
                        review_status: "draft".into(),
                    },
                )]),
                sources: BTreeMap::from([(
                    "source".into(),
                    Source {
                        authority_kind: "thomistic_text".into(),
                        author: "Thomas Aquinas".into(),
                        work: "Summa theologiae".into(),
                        locator: "I, q. 75, a. 4".into(),
                        url: "https://www.newadvent.org/summa/1075.htm".into(),
                    },
                )]),
                edges: BTreeMap::from([(
                    "broken".into(),
                    Edge {
                        subject: "person".into(),
                        relation: "has_part".into(),
                        object: "missing".into(),
                        source_id: "source".into(),
                        evidence_kind: "textual_paraphrase".into(),
                        review_status: "draft".into(),
                        included_in_model: true,
                    },
                )]),
                relations: BTreeMap::from([(
                    "has_part".into(),
                    Relation {
                        label: "Has part".into(),
                        kind: "composition".into(),
                        description: "A part relation".into(),
                    },
                )]),
                passion_profiles: BTreeMap::new(),
            },
            rationales: BTreeMap::new(),
            profile_rationales: BTreeMap::new(),
        };
        let errors = input.validate().unwrap_err();
        assert!(errors
            .iter()
            .any(|error| error.contains("unknown object missing")));
        assert!(errors
            .iter()
            .any(|error| error.contains("missing source rationale")));

        input.ontology.relations.insert(
            "creates".into(),
            Relation {
                label: "Creates".into(),
                kind: "creation".into(),
                description: "Gives being".into(),
            },
        );
        input.ontology.edges.get_mut("broken").unwrap().relation = "creates".into();
        let errors = input.validate().unwrap_err();
        assert!(errors
            .iter()
            .any(|error| error.contains("only God may be the subject of creates")));
    }
}
