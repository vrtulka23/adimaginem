"""Adapt SNT's versioned value export to the viewer's existing data contract."""

import re

RECORD_PATH = re.compile(
    r"^(ontology\.[a-z_]+|graph_viewer|graph_concept_styles|graph_relation_colors|"
    r"graph_tours|graph_tour_steps|graph_tour_positions)\[([a-z_0-9]+)\]\.([a-z_0-9]+)$")
ORDER_PATH = re.compile(r"^graph_layout\.(concept_order|edge_order)\[(\d+)\]\.(id|position)$")


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
    if export.get("schema") != "snt-dip-values/1":
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
    data["graph_layout"] = {}
    for name, records in orders.items():
        if sorted(records) != list(range(len(records))):
            raise ValueError(f"Non-contiguous DIPL layout order: {name}")
        data["graph_layout"][name] = [records[index] for index in range(len(records))]
    return data, {"items": items, "total": len(items), "truncated": False}
