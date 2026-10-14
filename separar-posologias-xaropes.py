#!/usr/bin/env python3
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RAIA_PROGRESS = ROOT / "bulas-medicamentos/importacao-bulas-raia-progresso.json"
ALIASES_PATH = ROOT / "bulas-medicamentos/ean-medicine-aliases.generated.js"
LIBRARIES = (
    (ROOT / "bulas-medicamentos/medicine-library-raia.generated.js", "window.RAIA_MEDICINE_LIBRARY"),
    (ROOT / "bulas-medicamentos/medicine-library-xlsx.generated.js", "window.XLSX_MEDICINE_LIBRARY"),
)
EXCLUDED_MEDICINES = {
    "acetilcisteina-eurofarma",
    "Asmofen",
    "Cambendazol",
    "gaballon",
    "Metoclopramida injetável, comprimidos e xarope",
    "Resfenol infantil e adulto",
}
FORCED_SYRUP_MEDICINES = {
    "Hixizine",
    "Bontoss xarope",
    "Koide D xarope",
    "Torante xarope",
    "Cobavital xarope e comprimidos",
    "Dexmine",
    "Actifedrin xarope e comprimidos",
    "Cetirizina",
}
MANUAL_PRESENTATION_STRENGTHS = {
    "dropropizina": ("3mg/mL", "1,5mg/mL"),
    "notuss-tss": ("3mg/mL", "1,5mg/mL"),
    "Filinar Xarope": ("10mg/mL", "5mg/mL"),
}

ADULT_PATTERNS = (
    (re.compile(r"xarope\s+adult(?:o|a)(?:\s+e\s+pedi[aá]trico\s+acima\s+de\s+12\s+anos)?\s*:?\n*", re.I), True),
    (re.compile(r"\b[\w®-]+\s+adulto\s*:", re.I), True),
    (re.compile(r"adultos?[^:\n]{0,100}xarope\s*:", re.I), False),
    (re.compile(r"xarope[^:\n]{0,60}adultos?[^:\n]{0,80}:", re.I), False),
    (re.compile(r"\badultos?(?:\s+e\s+(?:adolescentes|crian[cç]as)[^,:\n]{0,70})?\s*(?:-|,|\n)", re.I), False),
    (re.compile(r"(?:uso\s+adulto|adultos?(?:\s+e\s+(?:adolescentes|crian[cç]as)[^:\n]{0,60})?)\s*:", re.I), False),
)

PEDIATRIC_PATTERNS = (
    (re.compile(r"xarope\s+pedi[aá]trico\s*:?\n*", re.I), True),
    (re.compile(r"\b[\w®-]+\s+pedi[aá]trico\s*:", re.I), True),
    (re.compile(r"crian[cç]as?[^:\n]{0,100}xarope\s*:", re.I), False),
    (re.compile(r"\bcrian[cç]as(?:\s+(?:de|dos|entre|abaixo|acima|maiores|menores|com|at[eé]|a\s+partir)[^,:\n]{0,80})?\s*(?:-|,|\n)", re.I), False),
    (re.compile(r"(?:uso\s+pedi[aá]trico|pedi[aá]trico(?:\s*\([^)]*\))?|crian[cç]as(?:\s+(?:de|entre|abaixo|acima|maiores|menores|at[eé]|a\s+partir)[^:\n]{0,80})?)\s*:", re.I), False),
)
OTHER_FORM_HEADING = re.compile(
    r"(?:\b[\w®-]+\s+)?(?:comprimidos?|gotas?|c[aá]psulas?|dr[aá]geas?|injet[aá]vel|solu[cç][aã]o(?:\s+oral)?|suspens[aã]o(?:\s+oral)?)"
    r"(?:\s*\([^)]*\))?(?:\s+[^:]{0,60})?\s*:",
    re.I,
)


def load_library(path, prefix):
    source = path.read_text(encoding="utf-8")
    source = re.sub(rf"^{re.escape(prefix)}\s*=\s*", "", source).rstrip(";\n ")
    return json.loads(source)


def write_library(path, prefix, medicines):
    path.write_text(
        f"{prefix} = {json.dumps(medicines, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )


def section_text(section):
    if section.get("content"):
        return str(section["content"]).strip()
    parts = []
    for block in section.get("blocks", []):
        content = str(block.get("content") or "").strip()
        if not content:
            continue
        if block.get("type") == "heading" and not content.endswith(":"):
            content += ":"
        parts.append(content)
    return "\n\n".join(parts).strip()


def marker_candidates(text, patterns):
    candidates = []
    spans = set()
    for pattern, remove_label in patterns:
        for match in pattern.finditer(text):
            span = (match.start(), match.end())
            if span in spans:
                continue
            spans.add(span)
            candidates.append({
                "start": match.start(),
                "end": match.end(),
                "removeLabel": remove_label,
            })
    return candidates


def syrup_distance(text, marker):
    positions = [match.start() for match in re.finditer(r"\bxarope\b", text, re.I)]
    return min((min(abs(position - marker["start"]), abs(position - marker["end"])) for position in positions), default=10000)


def dosage_context_score(text, marker):
    snippet = text[marker["start"]:marker["end"] + 220]
    score = 0
    if re.search(r"\b\d+(?:[,.]\d+)?\s*m[lL]\b", snippet):
        score += 100
    if re.search(r"\bxarope\b", snippet, re.I):
        score += 50
    if not re.search(r"\bxarope\b|\bm[lL]\b", snippet, re.I) and re.search(r"\b(?:comprimidos?|gotas?|dr[aá]geas?|c[aá]psulas?)\b", snippet, re.I):
        score -= 140
    first_syrup_dose = re.search(r"\bxarope\b|\b\d+(?:[,.]\d+)?\s*m[lL]\b", snippet, re.I)
    first_other_form = re.search(r"\b(?:comprimidos?|gotas?|dr[aá]geas?|c[aá]psulas?)\b", snippet, re.I)
    if first_other_form and (not first_syrup_dose or first_other_form.start() < first_syrup_dose.start()):
        score -= 320
    return score


def select_marker_pair(text, force=False, medicine_name=""):
    if medicine_name in {"dropropizina", "notuss-tss"}:
        adult = re.search(r"(?:dropropizina|notuss\s+tss)\s*\(\s*3(?:[,.]0)?\s*mg\s*/\s*m[lL]\s*\)\s*:", text, re.I)
        pediatric = re.search(r"(?:dropropizina|notuss\s+tss)\s*\(\s*1[,.]5\s*mg\s*/\s*m[lL]\s*\)\s*:", text, re.I)
        if adult and pediatric:
            return (
                {"start": adult.start(), "end": adult.end(), "removeLabel": False},
                {"start": pediatric.start(), "end": pediatric.end(), "removeLabel": False},
            )
    adult_candidates = marker_candidates(text, ADULT_PATTERNS)
    pediatric_candidates = marker_candidates(text, PEDIATRIC_PATTERNS)
    best = None
    for adult in adult_candidates:
        for pediatric in pediatric_candidates:
            if adult["start"] < pediatric["end"] and pediatric["start"] < adult["end"]:
                continue
            start = min(adult["start"], pediatric["start"])
            end = max(adult["end"], pediatric["end"])
            syrup_between = bool(re.search(r"\bxarope\b", text[start:end], re.I))
            adult_distance = syrup_distance(text, adult)
            pediatric_distance = syrup_distance(text, pediatric)
            score = (
                (220 if adult["removeLabel"] else (100 if force else max(0, 130 - adult_distance)))
                + (220 if pediatric["removeLabel"] else (100 if force else max(0, 130 - pediatric_distance)))
                + (60 if syrup_between else 0)
                + (0 if force else dosage_context_score(text, adult))
                + (0 if force else dosage_context_score(text, pediatric))
                - abs(adult["start"] - pediatric["start"]) / 80
            )
            if best is None or score > best[0]:
                best = (score, adult, pediatric)
    if not best or best[0] < 30:
        return None, None
    return best[1], best[2]


def text_block(content):
    return {"type": "text", "content": content.strip()}


def medicine_slug(medicine):
    return Path(str(medicine.get("leafletPath") or "")).stem.lower()


def strength_value(value):
    match = re.fullmatch(r"\s*(\d+(?:[,.]\d+)?)\s*mg(?:\s*/\s*m[lL])?\s*", str(value or ""), re.I)
    return float(match.group(1).replace(",", ".")) if match else None


def unique_strengths(values):
    strengths = {}
    for value in values:
        number = strength_value(value)
        if number is not None:
            strengths[number] = re.sub(r"\s+", "", str(value)).replace("/ml", "/mL").replace("/ML", "/mL")
    return strengths


def annotate_syrup_presentations(medicine, aliases_by_slug):
    use_section = next((section for section in medicine.get("sections", []) if section.get("syrupDosageSplit")), None)
    if not use_section:
        return False

    manual_strengths = MANUAL_PRESENTATION_STRENGTHS.get(medicine.get("name"))
    if manual_strengths:
        adult_strength, pediatric_strength = manual_strengths
        medicine["presentations"] = [
            {"strength": adult_strength, "form": "xarope adulto", "label": f"{adult_strength} xarope adulto", "audience": "adult"},
            {"strength": pediatric_strength, "form": "xarope pediátrico", "label": f"{pediatric_strength} xarope pediátrico", "audience": "pediatric"},
        ]
        return True

    if not use_section.get("syrupAdultPresentationExplicit") or not use_section.get("syrupPediatricPresentationExplicit"):
        return False

    section_strengths = []
    for block in use_section.get("blocks", []):
        if block.get("type") == "text":
            section_strengths.extend(re.findall(r"\b\d+(?:[,.]\d+)?\s*mg\s*/\s*m[lL]\b", str(block.get("content") or ""), re.I))
    strengths = unique_strengths(section_strengths)

    official_strengths = [
        alias.get("strength")
        for alias in aliases_by_slug.get(medicine_slug(medicine), [])
        if re.search(r"\bxarope\b", str(alias.get("form") or ""), re.I)
    ]
    official = unique_strengths(official_strengths)
    if len(official) == 2:
        strengths = official

    if len(strengths) != 2:
        presentation_strengths = [
            presentation.get("strength")
            for presentation in medicine.get("presentations", [])
            if re.search(r"\bxarope\b", str(presentation.get("form") or ""), re.I)
        ]
        strengths = unique_strengths(presentation_strengths)
    if len(strengths) != 2:
        return False

    pediatric_number, adult_number = sorted(strengths)
    pediatric_strength = strengths[pediatric_number]
    adult_strength = strengths[adult_number]
    medicine["presentations"] = [
        {
            "strength": adult_strength,
            "form": "xarope adulto",
            "label": f"{adult_strength} xarope adulto",
            "audience": "adult",
        },
        {
            "strength": pediatric_strength,
            "form": "xarope pediátrico",
            "label": f"{pediatric_strength} xarope pediátrico",
            "audience": "pediatric",
        },
    ]
    return True


def split_syrup_dosage(medicine):
    if medicine.get("name") in EXCLUDED_MEDICINES:
        return False
    use_section = next((section for section in medicine.get("sections", []) if section.get("title") == "Como usar"), None)
    if not use_section:
        return False

    text = section_text(use_section)
    if not text or not re.search(r"\bxarope\b", f'{medicine.get("name", "")} {text}', re.I):
        return False

    adult, pediatric = select_marker_pair(
        text,
        medicine.get("name") in FORCED_SYRUP_MEDICINES,
        medicine.get("name", ""),
    )
    if not adult or not pediatric or adult["start"] == pediatric["start"]:
        return False

    markers = sorted((
        {**adult, "title": "Xarope adulto"},
        {**pediatric, "title": "Xarope pediátrico"},
    ), key=lambda marker: marker["start"])

    blocks = []
    introduction = text[:markers[0]["start"]].strip()
    if introduction:
        blocks.append(text_block(introduction))

    trailing = ""
    for index, marker in enumerate(markers):
        body_start = marker["end"] if marker["removeLabel"] else marker["start"]
        body_end = markers[index + 1]["start"] if index + 1 < len(markers) else len(text)
        if index + 1 == len(markers):
            other_form = OTHER_FORM_HEADING.search(text, body_start)
            if other_form:
                body_end = other_form.start()
                trailing = text[other_form.start():].strip()
        body = text[body_start:body_end].strip()
        blocks.append({"type": "heading", "content": marker["title"]})
        if body:
            blocks.append(text_block(body))
    if trailing:
        blocks.append({"type": "heading", "content": "Outras apresentações"})
        blocks.append(text_block(trailing))

    use_section.pop("content", None)
    use_section["blocks"] = blocks
    use_section["syrupDosageSplit"] = True
    use_section["syrupAdultPresentationExplicit"] = adult["removeLabel"]
    use_section["syrupPediatricPresentationExplicit"] = pediatric["removeLabel"]
    return True


def main():
    total_medicines = 0
    reviewed_syrups = 0
    split_medicines = []
    not_split = []
    presentation_medicines = []
    aliases = load_library(ALIASES_PATH, "window.EAN_MEDICINE_ALIASES")
    aliases_by_slug = {}
    for alias in aliases.values():
        aliases_by_slug.setdefault(alias.get("candidateSlug"), []).append(alias)

    for path, prefix in LIBRARIES:
        if prefix == "window.RAIA_MEDICINE_LIBRARY":
            medicines = json.loads(RAIA_PROGRESS.read_text(encoding="utf-8"))["medicines"]
        else:
            medicines = load_library(path, prefix)
        total_medicines += len(medicines)
        for medicine in medicines:
            use_section = next((section for section in medicine.get("sections", []) if section.get("title") == "Como usar"), None)
            text = section_text(use_section or {})
            is_syrup = bool(re.search(r"\bxarope\b", f'{medicine.get("name", "")} {text}', re.I))
            has_age_groups = bool(re.search(r"\badult", text, re.I) and re.search(r"\b(?:pedi[aá]tr|crian[cç])", text, re.I))
            if is_syrup and has_age_groups:
                reviewed_syrups += 1
                if split_syrup_dosage(medicine):
                    split_medicines.append(medicine.get("name"))
                else:
                    not_split.append(medicine.get("name"))
            if annotate_syrup_presentations(medicine, aliases_by_slug):
                presentation_medicines.append(medicine.get("name"))
        write_library(path, prefix, medicines)

    print(json.dumps({
        "totalMedicines": total_medicines,
        "syrupsWithAdultAndPediatricText": reviewed_syrups,
        "split": len(split_medicines),
        "notSplitForSafety": len(not_split),
        "notSplitNames": not_split,
        "separateAdultPediatricPresentations": len(presentation_medicines),
        "presentationNames": presentation_medicines,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
