use adimaginem::Input;
use serde_json::{json, Value};
use std::io::{self, Read};

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), String> {
    let mut input_text = String::new();
    io::stdin().read_to_string(&mut input_text).map_err(|e| e.to_string())?;
    let request: Value = serde_json::from_str(&input_text).map_err(|e| e.to_string())?;
    let input: Input = serde_json::from_value(request.get("data").cloned()
        .ok_or("missing data")?).map_err(|e| e.to_string())?;
    input.validate().map_err(|errors| errors.join("\n"))?;
    let command = request.get("command").and_then(Value::as_str).ok_or("missing command")?;
    let result = match command {
        "validate" => json!({
            "concepts": input.ontology.concepts.len(),
            "sources": input.ontology.sources.len(),
            "edges": input.ontology.edges.len(),
            "valid": true
        }),
        "concept" => {
            let id = request.get("id").and_then(Value::as_str).ok_or("missing id")?;
            let concept = input.ontology.concepts.get(id).ok_or("unknown concept")?;
            let source = input.ontology.sources.get(&concept.source_id).ok_or("unknown source")?;
            json!({"id": id, "concept": concept, "source": source})
        }
        "outgoing" => {
            let id = request.get("id").and_then(Value::as_str).ok_or("missing id")?;
            if !input.ontology.concepts.contains_key(id) { return Err("unknown concept".into()); }
            let relation = request.get("relation").and_then(Value::as_str);
            json!(input.cited_edges(id, relation))
        }
        _ => return Err(format!("unknown command: {command}")),
    };
    println!("{}", serde_json::to_string(&result).map_err(|e| e.to_string())?);
    Ok(())
}
