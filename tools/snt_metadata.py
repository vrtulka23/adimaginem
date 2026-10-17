"""Adapt SNT's versioned value export to the viewer's existing data contract."""

import re

RECORD_PATH = re.compile(
    r"^(ontology\.[a-z_]+|graph_viewer|graph_concept_styles|graph_relation_colors|"
    r"graph_tours|graph_tour_steps|graph_tour_positions)\[([a-z_0-9]+)\]\.([a-z_0-9]+)$")
ORDER_PATH = re.compile(r"^graph_layout\.(concept_order|edge_order)\[(\d+)\]\.(id|position)$")
SOURCE_METADATA_PATH = re.compile(r"^ontology\.sources\[([a-z_0-9]+)\](?:\.locator)?$")
BIBLIOGRAPHIC_FIELDS = {"authors": "author", "title": "work", "url": "url"}


def normalize_source_citations(data, items):
    """Keep the viewer's citation contract while authoring bibliography as metadata.

    Accept metadata on the source map item (v2) or its locator value (v1/v2).
    Legacy value fields remain readable; conflicting copies are rejected.
    """
    sources = data["ontology"].get("sources", {})
    for item in items:
        match = SOURCE_METADATA_PATH.fullmatch(item["path"])
        if not match:
            continue
        source_id = match[1]
        if source_id not in sources:
            raise ValueError(f"Citation metadata has no source record: {source_id}")
        source = sources[source_id]
        for metadata_field, value_field in BIBLIOGRAPHIC_FIELDS.items():
            metadata = item["metadata"]
            if metadata_field not in metadata or (
                    "present" in metadata and metadata_field not in metadata["present"]):
                continue
            value = metadata[metadata_field]
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"Source {source_id} has empty or invalid ?{metadata_field}")
            if value_field in source and source[value_field] != value:
                raise ValueError(f"Source {source_id} has conflicting {value_field}/?{metadata_field}")
            source[value_field] = value
    for source_id, source in sources.items():
        for metadata_field, value_field in BIBLIOGRAPHIC_FIELDS.items():
            value = source.get(value_field)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"Source {source_id} is missing {value_field}/?{metadata_field}; "
                                 "source-map metadata requires export schema v2; "
                                 "attach it to locator for v1 compatibility")


def shaped_value(record):
    """Use declared shape, including singleton arrays whose payload is scalar."""
    value = record["value"]
    if not record["is_array"]:
        if record["shape"]:
            raise ValueError("SNT scalar unexpectedly has an array shape")
        return value
    shape = record["shape"]
    if not shape or any(type(size) is not int or size < 0 for size in shape):
        raise ValueError("SNT array has an invalid shape")

    def flatten(item):
        if isinstance(item, list):
            return [leaf for child in item for leaf in flatten(child)]
        return [item]

    flat = flatten(value)
    count = 1
    for size in shape:
        count *= size
    if count != len(flat):
        raise ValueError("SNT array payload disagrees with its declared shape")
    leaves = iter(flat)

    def nest(dimensions):
        return [nest(dimensions[1:]) for _ in range(dimensions[0])] if dimensions else next(leaves)

    return nest(shape)


def decode_metadata(export):
    if export.get("schema") not in ("snt-dip-values/1", "snt-dip-values/2"):
        raise ValueError("Unsupported SNT metadata export schema")
    data = {"ontology": {"support_records": {}}}
    items = []
    orders = {"concept_order": {}, "edge_order": {}}
    for path, record in export["values"].items():
        # The viewer's transport has historically omitted explicit none fields.
        if record["presence"] == "none":
            if record["value"] is not None:
                raise ValueError(f"SNT none record has a value: {path}")
            continue
        if record["presence"] != "value":
            raise ValueError(f"Unknown SNT value presence: {path}")
        value = shaped_value(record)
        order = ORDER_PATH.fullmatch(path)
        if order:
            orders[order[1]].setdefault(int(order[2]), {})[order[3]] = value
            continue
        match = RECORD_PATH.fullmatch(path)
        if not match:
            raise ValueError(f"Unsupported viewer value path: {path}")
        root, key, field = match.groups()
        parent = data
        for part in root.split("."):
            parent = parent.setdefault(part, {})
        parent.setdefault(key, {})[field] = value
        metadata = record["metadata"]
        if set(metadata["present"]) != set(metadata["values"]):
            raise ValueError(f"SNT metadata presence disagrees with values: {path}")
        items.append({"path": path, "metadata": metadata["values"]})
    if export["schema"] == "snt-dip-values/2":
        inventory = export.get("node_metadata")
        if not isinstance(inventory, dict):
            raise ValueError("SNT export schema v2 requires a node_metadata inventory")
        by_path = {item["path"]: item for item in items}
        for path, record in inventory.items():
            metadata = record["metadata"]
            if set(metadata["present"]) != set(metadata["values"]):
                raise ValueError(f"SNT metadata presence disagrees with values: {path}")
            if path in by_path and by_path[path]["metadata"] != metadata["values"]:
                raise ValueError(f"Conflicting SNT value and node metadata: {path}")
            by_path[path] = {"path": path, "metadata": metadata["values"]}
        items = list(by_path.values())
    data["graph_layout"] = {}
    for name, records in orders.items():
        if sorted(records) != list(range(len(records))):
            raise ValueError(f"Non-contiguous DIPL layout order: {name}")
        data["graph_layout"][name] = [records[index] for index in range(len(records))]
    return data, {"items": items, "total": len(items), "truncated": False}
