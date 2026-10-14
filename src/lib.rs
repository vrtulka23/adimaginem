use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Source {
    #[serde(default = "unassessed")]
    pub witness_kind: String,
    pub date_note: Option<String>,
    pub biblical_book: Option<String>,
    pub biblical_chapter: Option<u32>,
    pub verse_start: Option<u32>,
    pub verse_end: Option<u32>,
    pub translation: Option<String>,
    pub authority_kind: String,
    pub author: String,
    pub work: String,
    pub locator: String,
    pub url: String,
}

fn unassessed() -> String {
    "unassessed".into()
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct SupportRecord {
    pub target_kind: String,
    pub target_id: String,
    pub claim: String,
    pub source_id: String,
    pub grounding: Vec<String>,
    pub support_kind: String,
    pub doctrinal_status: String,
    pub status_source_id: Option<String>,
    pub qualification: String,
    pub review_status: String,
}

#[derive(Debug, Serialize)]
pub struct CitedSupport<'a> {
    pub id: &'a str,
    pub record: &'a SupportRecord,
    pub rationale: &'a str,
    pub source: &'a Source,
    pub status_source: Option<&'a Source>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Concept {
    pub label: String,
    pub latin_name: String,
    pub domain: String,
    pub study_areas: Vec<String>,
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
    pub recipient_scope: String,
    pub affected_aspect: String,
    pub causal_mode: String,
    pub conditions: Option<String>,
    pub condition_source_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Relation {
    pub label: String,
    pub kind: String,
    pub description: String,
    pub prose_template: Option<String>,
    pub explanation_role: Option<String>,
    pub principle_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct PassionProfile {
    pub concept_id: String,
    pub appetite_id: String,
    pub object_aspect: String,
    pub object_description: String,
    pub attainability: String,
    pub arduous: bool,
    pub phase: String,
    pub temporal_relation: String,
    pub evidence_kind: String,
    pub review_status: String,
    pub source_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct StudyArea {
    pub label: String,
    pub latin_name: String,
    pub description: String,
    pub source_id: String,
    pub classification_note: String,
    pub evidence_kind: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Ontology {
    #[serde(default)]
    pub support_records: BTreeMap<String, SupportRecord>,
    pub study_areas: BTreeMap<String, StudyArea>,
    pub concepts: BTreeMap<String, Concept>,
    pub sources: BTreeMap<String, Source>,
    pub edges: BTreeMap<String, Edge>,
    pub relations: BTreeMap<String, Relation>,
    pub passion_profiles: BTreeMap<String, PassionProfile>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Input {
    #[serde(default)]
    pub support_rationales: BTreeMap<String, String>,
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
    pub condition_source: Option<&'a Source>,
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
        for (id, area) in &ontology.study_areas {
            if id.is_empty()
                || area.label.trim().is_empty()
                || area.latin_name.trim().is_empty()
                || area.description.trim().is_empty()
                || area.classification_note.trim().is_empty()
                || area.evidence_kind != "editorial_classification"
            {
                errors.push(format!(
                    "study area {id}: incomplete or non-editorial definition"
                ));
            }
            if !ontology.sources.contains_key(&area.source_id) {
                errors.push(format!(
                    "study area {id}: unknown source {}",
                    area.source_id
                ));
            }
        }
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
        for (id, source) in &ontology.sources {
            if ![
                "unassessed",
                "scripture",
                "ancient_philosophy",
                "patristic",
                "scholastic",
                "magisterial",
                "ecclesial_guidance",
                "pastoral_literature",
            ]
            .contains(&source.witness_kind.as_str())
            {
                errors.push(format!("source {id}: invalid witness kind"));
            }
            if source.witness_kind == "scripture" || source.authority_kind == "scripture" {
                if source.witness_kind != "scripture"
                    || source.authority_kind != "scripture"
                    || source
                        .biblical_book
                        .as_ref()
                        .map_or(true, |s| s.trim().is_empty())
                    || source
                        .translation
                        .as_ref()
                        .map_or(true, |s| s.trim().is_empty())
                    || source.biblical_chapter.unwrap_or(0) == 0
                    || source.verse_start.unwrap_or(0) == 0
                    || source.verse_end.unwrap_or(0) < source.verse_start.unwrap_or(1)
                {
                    errors.push(format!(
                        "source {id}: incomplete or invalid biblical locator"
                    ));
                }
            }
        }
        for (id, record) in &ontology.support_records {
            let valid_target = match record.target_kind.as_str() {
                "concept" => ontology.concepts.contains_key(&record.target_id),
                "edge" => ontology.edges.contains_key(&record.target_id),
                _ => false,
            };
            if !valid_target {
                errors.push(format!("support {id}: unknown target"));
            }
            if !ontology.sources.contains_key(&record.source_id) {
                errors.push(format!("support {id}: unknown source"));
            }
            let unique: std::collections::BTreeSet<_> = record.grounding.iter().collect();
            if record.grounding.is_empty()
                || unique.len() != record.grounding.len()
                || (record.grounding.len() > 1
                    && record.grounding.iter().any(|v| v == "unassessed"))
                || record.grounding.iter().any(|v| {
                    ![
                        "natural_reason",
                        "divine_revelation",
                        "reasoning_from_revelation",
                        "unassessed",
                    ]
                    .contains(&v.as_str())
                })
            {
                errors.push(format!("support {id}: invalid grounding"));
            }
            if ![
                "explicit_statement",
                "philosophical_argument",
                "theological_inference",
                "typological_interpretation",
                "doctrinal_formulation",
                "terminology_only",
                "editorial_classification",
            ]
            .contains(&record.support_kind.as_str())
                || ![
                    "unassessed",
                    "defined_doctrine",
                    "magisterial_teaching",
                    "theological_opinion",
                    "pastoral_terminology",
                    "editorial",
                ]
                .contains(&record.doctrinal_status.as_str())
                || !["draft", "reviewed", "contested"].contains(&record.review_status.as_str())
            {
                errors.push(format!("support {id}: invalid classification"));
            }
            if record.claim.trim().is_empty()
                || record.qualification.trim().is_empty()
                || self
                    .support_rationales
                    .get(id)
                    .map_or(true, |r| r.trim().is_empty())
            {
                errors.push(format!(
                    "support {id}: missing claim, qualification or rationale"
                ));
            }
            let status_source = record
                .status_source_id
                .as_ref()
                .and_then(|id| ontology.sources.get(id));
            if (record.doctrinal_status != "unassessed" || record.status_source_id.is_some())
                && status_source.is_none()
            {
                errors.push(format!("support {id}: doctrinal status needs a source"));
            }
            if ["defined_doctrine", "magisterial_teaching"]
                .contains(&record.doctrinal_status.as_str())
                && status_source.map_or(true, |s| s.authority_kind != "church_teaching")
            {
                errors.push(format!(
                    "support {id}: doctrinal grade needs a magisterial source"
                ));
            }
        }
        for id in self.support_rationales.keys() {
            if !ontology.support_records.contains_key(id) {
                errors.push(format!("support rationale {id}: unknown record"));
            }
        }
        for (id, concept) in &ontology.concepts {
            if concept.study_areas.is_empty() {
                errors.push(format!("concept {id}: at least one study area is required"));
            }
            let mut seen = std::collections::BTreeSet::new();
            for area in &concept.study_areas {
                if !ontology.study_areas.contains_key(area) {
                    errors.push(format!("concept {id}: unknown study area {area}"));
                }
                if !seen.insert(area) {
                    errors.push(format!("concept {id}: duplicate study area {area}"));
                }
            }
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
            if edge.conditions.is_some() != edge.condition_source_id.is_some()
                || edge
                    .conditions
                    .as_ref()
                    .is_some_and(|s| s.trim().is_empty())
                || edge
                    .condition_source_id
                    .as_ref()
                    .is_some_and(|s| s.trim().is_empty())
            {
                errors.push(format!(
                    "edge {id}: conditions and condition citation must occur together"
                ));
            }
            if let Some(source_id) = &edge.condition_source_id {
                if !ontology.sources.contains_key(source_id) {
                    errors.push(format!("edge {id}: unknown condition source {source_id}"));
                }
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
            if let Some(principle_id) = &relation.principle_id {
                if !ontology.concepts.contains_key(principle_id) {
                    errors.push(format!("relation {id}: unknown principle {principle_id}"));
                }
            }
            if id.is_empty()
                || relation.label.trim().is_empty()
                || relation.description.trim().is_empty()
            {
                errors.push(format!("relation {id}: incomplete definition"));
            }
            if let Some(role) = &relation.explanation_role {
                if !["context", "capacity", "effect", "limit"].contains(&role.as_str()) {
                    errors.push(format!("relation {id}: unknown explanation role {role}"));
                }
            }
            if let Some(template) = &relation.prose_template {
                let remainder = template.replace("{subject}", "").replace("{object}", "");
                if !template.contains("{subject}")
                    || !template.contains("{object}")
                    || remainder.contains(['{', '}'])
                {
                    errors.push(format!("relation {id}: prose template must use only subject and object placeholders, including both"));
                }
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

    pub fn cited_support(&self, target_kind: &str, target_id: &str) -> Vec<CitedSupport<'_>> {
        self.ontology
            .support_records
            .iter()
            .filter(|(_, record)| {
                record.target_kind == target_kind && record.target_id == target_id
            })
            .map(|(id, record)| CitedSupport {
                id,
                record,
                rationale: self.support_rationales[id].as_str(),
                source: &self.ontology.sources[&record.source_id],
                status_source: record
                    .status_source_id
                    .as_ref()
                    .and_then(|id| self.ontology.sources.get(id)),
            })
            .collect()
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
                    condition_source: edge
                        .condition_source_id
                        .as_ref()
                        .and_then(|id| self.ontology.sources.get(id)),
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

    fn example_input() -> Input {
        Input {
            support_rationales: BTreeMap::new(),
            ontology: Ontology {
                support_records: BTreeMap::new(),
                study_areas: BTreeMap::from([(
                    "anthropology".into(),
                    StudyArea {
                        label: "Human ontology".into(),
                        latin_name: "de homine".into(),
                        description: "Human nature and powers".into(),
                        source_id: "source".into(),
                        classification_note: "Editorial study grouping".into(),
                        evidence_kind: "editorial_classification".into(),
                    },
                )]),
                concepts: BTreeMap::from([(
                    "person".into(),
                    Concept {
                        label: "Person".into(),
                        latin_name: "persona".into(),
                        domain: "anthropology".into(),
                        study_areas: vec!["anthropology".into()],
                        category: "person".into(),
                        note: "A cited concept".into(),
                        source_id: "source".into(),
                        review_status: "draft".into(),
                    },
                )]),
                sources: BTreeMap::from([(
                    "source".into(),
                    Source {
                        witness_kind: "scholastic".into(),
                        date_note: None,
                        biblical_book: None,
                        biblical_chapter: None,
                        verse_start: None,
                        verse_end: None,
                        translation: None,
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
                        recipient_scope: "unspecified".into(),
                        affected_aspect: "unspecified".into(),
                        causal_mode: "unspecified".into(),
                        conditions: None,
                        condition_source_id: None,
                    },
                )]),
                relations: BTreeMap::from([(
                    "has_part".into(),
                    Relation {
                        label: "Has part".into(),
                        kind: "composition".into(),
                        description: "A part relation".into(),
                        prose_template: None,
                        explanation_role: None,
                        principle_id: None,
                    },
                )]),
                passion_profiles: BTreeMap::new(),
            },
            rationales: BTreeMap::new(),
            profile_rationales: BTreeMap::new(),
        }
    }

    #[test]
    fn study_memberships_and_scope_sources_must_resolve() {
        let mut input = example_input();
        assert!(!input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("study area")));
        input
            .ontology
            .concepts
            .get_mut("person")
            .unwrap()
            .study_areas = vec!["missing".into(), "missing".into()];
        let errors = input.validate().unwrap_err();
        assert!(errors
            .iter()
            .any(|e| e.contains("unknown study area missing")));
        assert!(errors
            .iter()
            .any(|e| e.contains("duplicate study area missing")));
        input
            .ontology
            .concepts
            .get_mut("person")
            .unwrap()
            .study_areas
            .clear();
        input
            .ontology
            .study_areas
            .get_mut("anthropology")
            .unwrap()
            .source_id = "missing".into();
        let errors = input.validate().unwrap_err();
        assert!(errors.iter().any(|e| e.contains("at least one study area")));
        assert!(errors
            .iter()
            .any(|e| e.contains("study area anthropology: unknown source missing")));
    }

    #[test]
    fn relation_principles_must_resolve_to_concepts() {
        let mut input = example_input();
        input
            .ontology
            .relations
            .get_mut("has_part")
            .unwrap()
            .principle_id = Some("missing_principle".into());
        let errors = input.validate().unwrap_err();
        assert!(errors
            .iter()
            .any(|e| e.contains("unknown principle missing_principle")));

        input
            .ontology
            .relations
            .get_mut("has_part")
            .unwrap()
            .principle_id = Some("person".into());
        let errors = input.validate().unwrap_err();
        assert!(!errors.iter().any(|e| e.contains("unknown principle")));
    }

    #[test]
    fn prose_templates_require_both_supported_placeholders() {
        let mut input = example_input();
        for (template, invalid) in [
            ("{subject} has {object} as a part.", false),
            ("{subject} has a part.", true),
            ("{subject} {unknown} {object}.", true),
        ] {
            input
                .ontology
                .relations
                .get_mut("has_part")
                .unwrap()
                .prose_template = Some(template.into());
            let errors = input.validate().unwrap_err();
            assert_eq!(
                errors.iter().any(|error| error.contains("prose template")),
                invalid
            );
        }
    }

    #[test]
    fn invalid_reference_and_missing_rationale_are_rejected() {
        let mut input = example_input();
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
                prose_template: None,
                explanation_role: None,
                principle_id: None,
            },
        );
        input.ontology.edges.get_mut("broken").unwrap().relation = "creates".into();
        let errors = input.validate().unwrap_err();
        assert!(errors
            .iter()
            .any(|error| error.contains("only God may be the subject of creates")));
    }

    #[test]
    fn conditions_require_a_resolvable_citation_and_survive_queries() {
        let mut input = example_input();
        input
            .rationales
            .insert("broken".into(), "Test claim".into());
        let edge = input.ontology.edges.get_mut("broken").unwrap();
        edge.object = "person".into();
        edge.conditions = Some("A stated condition".into());
        edge.recipient_scope = "human_person".into();
        edge.causal_mode = "instrumental".into();
        assert!(input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("must occur together")));

        input
            .ontology
            .edges
            .get_mut("broken")
            .unwrap()
            .condition_source_id = Some("missing".into());
        assert!(input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("unknown condition source")));

        input
            .ontology
            .edges
            .get_mut("broken")
            .unwrap()
            .condition_source_id = Some("source".into());
        assert!(input.validate().is_ok());
        let result = serde_json::to_value(input.cited_edges("person", None)).unwrap();
        assert_eq!(result[0]["edge"]["conditions"], "A stated condition");
        assert_eq!(result[0]["edge"]["recipient_scope"], "human_person");
        assert_eq!(result[0]["edge"]["causal_mode"], "instrumental");
        assert_eq!(result[0]["edge"]["condition_source_id"], "source");

        assert_eq!(result[0]["condition_source"]["author"], "Thomas Aquinas");
        input.ontology.edges.get_mut("broken").unwrap().conditions = None;
        assert!(input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("must occur together")));
    }
    #[test]
    fn claim_assessments_require_resolved_evidence_and_stay_on_their_target() {
        let mut input = example_input();
        input.ontology.edges.clear();
        input.ontology.support_records.insert(
            "reason".into(),
            SupportRecord {
                target_kind: "concept".into(),
                target_id: "person".into(),
                claim: "An exact claim".into(),
                source_id: "source".into(),
                grounding: vec!["natural_reason".into()],
                support_kind: "philosophical_argument".into(),
                doctrinal_status: "unassessed".into(),
                status_source_id: None,
                qualification: "Only this argument".into(),
                review_status: "draft".into(),
            },
        );
        input
            .support_rationales
            .insert("reason".into(), "The argument supports this claim".into());
        assert!(input.validate().is_ok());
        assert_eq!(input.cited_support("concept", "person").len(), 1);
        assert!(input.cited_support("edge", "person").is_empty());
        let result = serde_json::to_value(input.cited_support("concept", "person")).unwrap();
        assert_eq!(result[0]["rationale"], "The argument supports this claim");
        assert_eq!(result[0]["source"]["locator"], "I, q. 75, a. 4");
        input
            .ontology
            .support_records
            .get_mut("reason")
            .unwrap()
            .grounding
            .push("unassessed".into());
        assert!(input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("invalid grounding")));
        let record = input.ontology.support_records.get_mut("reason").unwrap();
        record.grounding.pop();
        record.doctrinal_status = "defined_doctrine".into();
        record.status_source_id = Some("source".into());
        assert!(input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("magisterial source")));
        let record = input.ontology.support_records.get_mut("reason").unwrap();
        record.doctrinal_status = "unassessed".into();
        record.target_id = "missing".into();
        input.support_rationales.clear();
        let errors = input.validate().unwrap_err();
        assert!(errors.iter().any(|e| e.contains("unknown target")));
        assert!(errors
            .iter()
            .any(|e| e.contains("missing claim, qualification or rationale")));
    }

    #[test]
    fn scripture_requires_an_identified_translation_and_valid_verse_range() {
        let mut input = example_input();
        input.ontology.edges.clear();
        let source = input.ontology.sources.get_mut("source").unwrap();
        source.authority_kind = "scripture".into();
        source.witness_kind = "scripture".into();
        source.biblical_book = Some("John".into());
        source.biblical_chapter = Some(1);
        source.verse_start = Some(1);
        source.verse_end = Some(3);
        assert!(input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("biblical locator")));
        input
            .ontology
            .sources
            .get_mut("source")
            .unwrap()
            .translation = Some("Identified edition".into());
        assert!(input.validate().is_ok());
        input.ontology.sources.get_mut("source").unwrap().verse_end = Some(0);
        assert!(input
            .validate()
            .unwrap_err()
            .iter()
            .any(|e| e.contains("biblical locator")));
    }
}
