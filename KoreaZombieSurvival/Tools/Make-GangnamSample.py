"""Convert one small OSM API development extract to the bounded Unity map format."""
import json
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--input", default="Tools/Downloads/gangnam-sample.osm")
parser.add_argument("--output", default="Assets/Game/Resources/MapSnapshots/Gangnam.json")
args = parser.parse_args()
source = (root / args.input).read_text(encoding="utf-8")
if source.lstrip().startswith("<"):
    tree = ET.fromstring(source)
    entries = []
    for e in tree:
        if e.tag == "node":
            entries.append({"type": "node", "id": int(e.attrib["id"]), "lat": float(e.attrib["lat"]), "lon": float(e.attrib["lon"]),
                            "tags": {t.attrib["k"]: t.attrib["v"] for t in e.findall("tag")}})
        elif e.tag == "way":
            entries.append({"type": "way", "id": int(e.attrib["id"]), "nodes": [int(n.attrib["ref"]) for n in e.findall("nd")],
                            "tags": {t.attrib["k"]: t.attrib["v"] for t in e.findall("tag")}})
    raw = {"elements": entries}
else:
    raw = json.loads(source)
nodes = {e["id"]: (e["lat"], e["lon"]) for e in raw["elements"] if e["type"] == "node"}
keep = {"amenity", "shop", "building", "landuse", "highway", "leisure", "natural", "name", "building:levels", "height", "tunnel", "layer"}
elements = []
for e in raw["elements"]:
    tags = {k: v for k, v in e.get("tags", {}).items() if k in keep}
    if not tags or not any(k in tags for k in ("amenity", "shop", "building", "highway")) and tags.get("leisure") != "park" and tags.get("natural") != "water":
        continue
    if e["type"] == "node":
        if not any(k in tags for k in ("amenity", "shop")):
            continue
        elements.append({"type": "node", "id": e["id"], "lat": e["lat"], "lon": e["lon"], "tags": tags})
    elif e["type"] == "way":
        geometry = [dict(zip(("lat", "lon"), nodes[n])) for n in e.get("nodes", []) if n in nodes]
        if len(geometry) < 2:
            continue
        center = {"lat": sum(p["lat"] for p in geometry) / len(geometry),
                  "lon": sum(p["lon"] for p in geometry) / len(geometry)}
        elements.append({"type": "way", "id": e["id"], "center": center, "geometry": geometry, "tags": tags})
out = root / args.output
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"elements": elements}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(elements)} features, {out.stat().st_size} bytes")
