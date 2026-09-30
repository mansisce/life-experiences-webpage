"""Build an editable Excel workbook from HLRD.md and LLRD.md.

    uv run --with openpyxl python docs/rewards/tools/build_requirements_xlsx.py

The markdown files stay the source of truth; rerun this after they change. Every markdown table
becomes a table on its section's sheet, and every requirement is collected into one editable
Requirements Register, with a formula-driven Traceability rollup per epic.
"""

import re
import sys
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

DOCS = Path(__file__).resolve().parent.parent
OUTPUT = DOCS / "Rewards_HLRD_LLRD.xlsx"

FONT = "Arial"
INK = "1A1A1A"
BODY = "404040"
HEADER_FILL = PatternFill("solid", fgColor="305BAB")
TITLE_FILL = PatternFill("solid", fgColor="F0F5FD")
EDIT_FILL = PatternFill("solid", fgColor="FFF6B6")  # columns the user is invited to edit
THIN = Side(style="thin", color="D0D0D0")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP_TOP = Alignment(wrap_text=True, vertical="top")

STATUSES = ["Built & tested", "Built (manual test)", "Planned", "Next", "Out of scope"]
PRIORITIES = ["Must", "Should", "Could", "Won't (now)"]


# ── Markdown parsing ──────────────────────────────────────────────────────────


def clean(text: str) -> str:
    text = text.replace("\\|", "|")
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)  # [label](url) -> label
    text = re.sub(r"~~(.+?)~~", r"\1 (closed)", text)
    text = text.replace("**", "").replace("`", "")
    text = text.replace("<br/>", "\n").replace("<br>", "\n")
    return text.strip()


def split_row(line: str) -> list[str]:
    cells = re.split(r"(?<!\\)\|", line.strip().strip("|"))
    return [clean(c) for c in cells]


def parse_sections(md: str) -> list[dict]:
    """Split into `## ` sections; each holds blocks: tables, bullet lists, paragraphs, diagram notes."""
    sections: list[dict] = []
    current = {"title": "Overview", "blocks": []}
    heading = None
    lines = md.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("## "):
            if current["blocks"]:
                sections.append(current)
            current, heading = {"title": clean(line[3:]), "blocks": []}, None
        elif line.startswith(("### ", "#### ")):
            heading = clean(line.lstrip("#"))
        elif re.match(r"^\*\*[^*]+\*\*\s*$", line.strip()):
            heading = clean(line)
        elif line.startswith("```"):
            lang = line[3:].strip()
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                i += 1
            if lang == "mermaid":
                current["blocks"].append({"kind": "note", "heading": heading,
                                          "text": "Diagram: see the markdown document or the Miro board."})
        elif line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                if not re.match(r"^\|\s*:?-{3,}", lines[i]):
                    rows.append(split_row(lines[i]))
                i += 1
            current["blocks"].append({"kind": "table", "heading": heading, "rows": rows})
            heading = None
            continue
        elif re.match(r"^(\s*[-*]|\s*\d+\.)\s+", line):
            items = []
            while i < len(lines) and re.match(r"^(\s*[-*]|\s*\d+\.)\s+", lines[i]):
                items.append(clean(re.sub(r"^\s*([-*]|\d+\.)\s+", "", lines[i])))
                i += 1
            current["blocks"].append({"kind": "list", "heading": heading, "items": items})
            heading = None
            continue
        elif line.startswith(">"):
            current["blocks"].append({"kind": "note", "heading": heading, "text": clean(line.lstrip("> "))})
        elif line.strip() and not line.startswith("# ") and line.strip() != "---":
            current["blocks"].append({"kind": "note", "heading": heading, "text": clean(line)})
        i += 1
    if current["blocks"]:
        sections.append(current)
    return sections


# ── Writing helpers ───────────────────────────────────────────────────────────


SHORT_TITLES = {
    "Feature-level As-Is → To-Be": "As-Is to To-Be",
    "Detailed functional requirements": "Functional reqs",
    "Screen requirements (MFE)": "Screen reqs",
    "Detailed non-functional requirements": "Non-functional reqs",
    "High-level requirements": "High-level reqs",
}


def sheet_name(prefix: str, title: str, used: set[str]) -> str:
    number, _, rest = title.partition(" ")
    title = f"{number} {SHORT_TITLES.get(rest, rest)}" if number.endswith(".") else SHORT_TITLES.get(title, title)
    name = re.sub(r"[:\\/?*\[\]]", "", f"{prefix} {title}").replace("→", "to")
    name = re.sub(r"\s+", " ", name)[:31].strip()
    base, n = name, 2
    while name in used:
        name = f"{base[:28]} {n}"
        n += 1
    used.add(name)
    return name


def style_header(cell):
    cell.font = Font(name=FONT, bold=True, color="FFFFFF")
    cell.fill = HEADER_FILL
    cell.alignment = Alignment(wrap_text=True, vertical="center")
    cell.border = BORDER


def style_body(cell):
    cell.font = Font(name=FONT, color=BODY)
    cell.alignment = WRAP_TOP
    cell.border = BORDER


def write_sheet_title(ws, title: str, subtitle: str | None = None) -> int:
    ws["A1"] = title
    ws["A1"].font = Font(name=FONT, bold=True, size=16, color=INK)
    row = 2
    if subtitle:
        ws["A2"] = subtitle
        ws["A2"].font = Font(name=FONT, italic=True, color=BODY)
        row = 3
    return row + 1


def write_block_heading(ws, row: int, text: str) -> int:
    cell = ws.cell(row=row, column=1, value=text)
    cell.font = Font(name=FONT, bold=True, size=12, color=INK)
    cell.fill = TITLE_FILL
    return row + 1


def fit_columns(ws, max_width: int = 70):
    widths: dict[int, int] = {}
    for row in ws.iter_rows(min_row=3):
        for cell in row:
            if cell.value is None:
                continue
            longest = max(len(part) for part in str(cell.value).split("\n"))
            widths[cell.column] = max(widths.get(cell.column, 8), min(max_width, longest + 2))
    for col, width in widths.items():
        ws.column_dimensions[get_column_letter(col)].width = width


def write_section(ws, section: dict):
    row = write_sheet_title(ws, section["title"])
    for block in section["blocks"]:
        if block.get("heading"):
            row = write_block_heading(ws, row, block["heading"])
        if block["kind"] == "table":
            header, *body = block["rows"]
            for c, value in enumerate(header, start=1):
                style_header(ws.cell(row=row, column=c, value=value))
            for r, values in enumerate(body, start=row + 1):
                for c, value in enumerate(values, start=1):
                    style_body(ws.cell(row=r, column=c, value=value))
            row += len(body) + 2
        elif block["kind"] == "list":
            for item in block["items"]:
                style_body(ws.cell(row=row, column=1, value=f"• {item}"))
                row += 1
            row += 1
        else:
            cell = ws.cell(row=row, column=1, value=block["text"])
            cell.font = Font(name=FONT, color=BODY)
            cell.alignment = Alignment(wrap_text=False, vertical="top")
            row += 2
    fit_columns(ws)


# ── Requirements register ─────────────────────────────────────────────────────

ID_TYPES = [
    (r"^BR-R\d+$", "Business rule"),
    (r"^BR-\d+$", "Business requirement"),
    (r"^HLR-\d+$", "Epic (HLR)"),
    (r"^HNFR-\d+$", "Non-functional (high level)"),
    (r"^LLR-\d+\.\d+$", "Functional (LLR)"),
    (r"^NFR-D\d+$", "Non-functional (detailed)"),
]


def requirement_type(req_id: str) -> str | None:
    for pattern, label in ID_TYPES:
        if re.match(pattern, req_id):
            return label
    return None


def parent_epic(req_id: str) -> str:
    if m := re.match(r"^LLR-(\d+)\.(\d+)$", req_id):
        major, minor = int(m[1]), int(m[2])
        if major == 4 and minor >= 9:
            return "HLR-9"
        if major == 8 and minor in (7, 8):
            return "HLR-9"
        if major == 8 and minor == 10:
            return "HLR-1"
        if major == 8 and minor == 11:
            return "HLR-10"
        if major == 8 and minor == 12:
            return "HLR-11"
        if major == 8 and minor == 13:
            return "HLR-12"
        return f"HLR-{major}"
    if m := re.match(r"^BR-R(\d+)$", req_id):
        n = int(m[1])
        if n <= 6:
            return "HLR-3"
        if n <= 11:
            return "HLR-4"
        if n <= 16:
            return "HLR-9"
        if n <= 19:
            return "HLR-1"
        if n <= 21:
            return "HLR-10"
        return "HLR-11" if n <= 26 else "HLR-12"
    if req_id.startswith(("NFR-D", "HNFR")):
        return "Cross-cutting"
    return ""


def normalise_status(raw: str, req_id: str) -> str:
    if "next" in raw.lower():  # e.g. "🟡 areas ✅, tiles CRUD ⏳ next": the open work wins
        return "Next"
    if "✅" in raw or raw.startswith("Built"):
        return "Built & tested"
    if "🟡" in raw:
        return "Built (manual test)"
    if "Post-MVP" in raw:
        return "Planned"
    if "⏳" in raw or "next" in raw.lower():
        return "Next" if "next" in raw.lower() or "HLR-9" in raw or "T3a" in raw else "Planned"
    if req_id.startswith(("BR-R", "NFR-D", "HNFR", "BR-")):
        return ""
    return "Planned"


NEXT_EPICS: set[str] = set()
# Rules and NFRs from tables without a status column that describe work not built yet.
NOT_YET_BUILT = {"NFR-D9", "NFR-D10", "NFR-D11"}


def collect_requirements(docs: list[tuple[str, list[dict]]]) -> list[dict]:
    found: dict[str, dict] = {}
    for doc_name, sections in docs:
        for section in sections:
            for block in section["blocks"]:
                if block["kind"] != "table":
                    continue
                header, *body = block["rows"]
                lower = [h.lower() for h in header]
                text_col = next((i for i, h in enumerate(lower)
                                 if h in ("requirement", "rule", "summary", "quality")), 1)
                status_col = next((i for i, h in enumerate(lower) if h in ("status", "mvp")), None)
                for values in body:
                    req_id = values[0]
                    kind = requirement_type(req_id)
                    if not kind or req_id in found:
                        continue
                    text = values[text_col] if text_col < len(values) else ""
                    if kind == "Epic (HLR)":
                        text = f"{values[1]}: {values[2]}"
                    if kind == "Non-functional (high level)" and len(values) > 2:
                        text = f"{values[1]}: {values[2]}"
                    raw_status = values[status_col] if status_col is not None and status_col < len(values) else ""
                    measure = values[2] if kind == "Business requirement" and len(values) > 2 else ""
                    parent = parent_epic(req_id)
                    status = normalise_status(raw_status, req_id)
                    if kind == "Business requirement":
                        status = ""  # outcomes, measured over time; not "built"
                    elif not status:  # tables without a status column
                        status = {"Non-functional (high level)": "Built (manual test)"}.get(kind, "Built & tested")
                    if parent in NEXT_EPICS and status in ("Planned", "Built & tested") and not (
                        parent == "HLR-1" and kind == "Functional (LLR)"  # built area CRUD stays built
                    ):
                        status = "Next"  # agreed next builds; not implemented yet
                    if req_id in NOT_YET_BUILT:
                        status = "Next"
                    if text.startswith("Superseded"):
                        status = "Out of scope"
                    found[req_id] = {
                        "id": req_id,
                        "type": kind,
                        "parent": parent,
                        "text": text,
                        "status": status,
                        "measure": measure,
                        "source": f"{doc_name} › {section['title']}",
                    }
    type_order = ["Business requirement", "Epic (HLR)", "Non-functional (high level)", "Functional (LLR)",
                  "Business rule", "Non-functional (detailed)"]
    return sorted(found.values(), key=lambda r: (
        type_order.index(r["type"]),
        [int(n) for n in re.findall(r"\d+", r["id"])],
    ))


REGISTER_COLUMNS = [
    ("ID", 12), ("Type", 24), ("Parent epic", 14), ("Requirement", 80), ("Status", 20),
    ("Priority", 12), ("Owner", 14), ("Success measure / acceptance", 40), ("Notes", 40), ("Source", 34),
]
EDITABLE = {"Requirement", "Status", "Priority", "Owner", "Success measure / acceptance", "Notes"}


def write_register(ws, requirements: list[dict]) -> int:
    ws["A1"] = "Requirements Register"
    ws["A1"].font = Font(name=FONT, bold=True, size=16, color=INK)
    ws["A2"] = "One row per requirement. Yellow columns are yours to edit; Status and Priority have dropdowns."
    ws["A2"].font = Font(name=FONT, italic=True, color=BODY)
    header_row = 4
    for c, (name, width) in enumerate(REGISTER_COLUMNS, start=1):
        style_header(ws.cell(row=header_row, column=c, value=name))
        ws.column_dimensions[get_column_letter(c)].width = width
    for r, req in enumerate(requirements, start=header_row + 1):
        values = [req["id"], req["type"], req["parent"], req["text"], req["status"],
                  "Must" if req["status"] in ("Built & tested", "Built (manual test)", "Next") else "Should",
                  "Mansi", req["measure"], "", req["source"]]
        for c, value in enumerate(values, start=1):
            cell = ws.cell(row=r, column=c, value=value)
            style_body(cell)
            if REGISTER_COLUMNS[c - 1][0] in EDITABLE:
                cell.fill = EDIT_FILL
    last = header_row + len(requirements)
    # Room for new rows: validation covers 200 extra lines.
    status_dv = DataValidation(type="list", formula1=f'"{",".join(STATUSES)}"', allow_blank=True)
    priority_dv = DataValidation(type="list", formula1=f'"{",".join(PRIORITIES)}"', allow_blank=True)
    ws.add_data_validation(status_dv)
    ws.add_data_validation(priority_dv)
    status_dv.add(f"E{header_row + 1}:E{last + 200}")
    priority_dv.add(f"F{header_row + 1}:F{last + 200}")
    ws.auto_filter.ref = f"A{header_row}:{get_column_letter(len(REGISTER_COLUMNS))}{last}"
    ws.freeze_panes = ws.cell(row=header_row + 1, column=2)
    return last


def write_traceability(ws, requirements: list[dict], register_last_row: int):
    ws["A1"] = "Traceability by epic"
    ws["A1"].font = Font(name=FONT, bold=True, size=16, color=INK)
    ws["A2"] = "Counts are live formulas over the Requirements Register; change a status there and this updates."
    ws["A2"].font = Font(name=FONT, italic=True, color=BODY)
    headers = ["Epic", "Title", "LLRs + rules", "Built & tested", "Built (manual)", "Next", "Planned", "% built"]
    widths = [12, 44, 14, 16, 16, 10, 10, 10]
    for c, (name, width) in enumerate(zip(headers, widths), start=1):
        style_header(ws.cell(row=4, column=c, value=name))
        ws.column_dimensions[get_column_letter(c)].width = width

    reg = "'Requirements Register'"
    end = register_last_row + 200  # include rows the user adds
    ids, parents, statuses = (f"{reg}!${col}$5:${col}${end}" for col in ("A", "C", "E"))
    epics = [r for r in requirements if r["type"] == "Epic (HLR)"]
    for r, epic in enumerate(epics, start=5):
        ws.cell(row=r, column=1, value=epic["id"])
        # Title looked up from the register so a renamed epic flows through.
        ws.cell(row=r, column=2, value=f'=IFERROR(INDEX({reg}!$D$5:$D${end},MATCH(A{r},{ids},0)),"")')
        ws.cell(row=r, column=3, value=f"=COUNTIF({parents},A{r})")
        ws.cell(row=r, column=4, value=f'=COUNTIFS({parents},A{r},{statuses},"Built & tested")')
        ws.cell(row=r, column=5, value=f'=COUNTIFS({parents},A{r},{statuses},"Built (manual test)")')
        ws.cell(row=r, column=6, value=f'=COUNTIFS({parents},A{r},{statuses},"Next")')
        ws.cell(row=r, column=7, value=f'=COUNTIFS({parents},A{r},{statuses},"Planned")')
        ws.cell(row=r, column=8, value=f"=IF(C{r}=0,\"-\",(D{r}+E{r})/C{r})")
        ws.cell(row=r, column=8).number_format = "0%"
        for c in range(1, 9):
            style_body(ws.cell(row=r, column=c))
        ws.cell(row=r, column=8).number_format = "0%"
    total = 5 + len(epics)
    ws.cell(row=total, column=1, value="Total")
    for c, col in zip(range(3, 8), "CDEFG"):
        ws.cell(row=total, column=c, value=f"=SUM({col}5:{col}{total - 1})")
    ws.cell(row=total, column=8, value=f"=IF(C{total}=0,\"-\",(D{total}+E{total})/C{total})")
    for c in range(1, 9):
        cell = ws.cell(row=total, column=c)
        style_body(cell)
        cell.font = Font(name=FONT, bold=True, color=INK)
    ws.cell(row=total, column=8).number_format = "0%"
    ws.freeze_panes = "A5"


def write_readme(ws, generated: str):
    rows = [
        ("Rewards Microfrontend: HLRD and LLRD workbook", "title"),
        (f"Generated {generated} from docs/rewards/HLRD.md and docs/rewards/LLRD.md.", "note"),
        ("", None),
        ("How to use this workbook", "h"),
        ("• Requirements Register: one row per requirement. Edit the yellow columns (Requirement, Status, Priority, Owner, Success measure, Notes). Status and Priority are dropdowns.", "p"),
        ("• To add a requirement, add a row at the bottom of the register: give it an ID (e.g. LLR-4.19) and a Parent epic (e.g. HLR-9); the Traceability tab counts it automatically.", "p"),
        ("• Traceability: live formulas per epic (how many requirements, how many built). Don't type over it.", "p"),
        ("• HLRD / LLRD tabs: each section of the documents with its tables, for reading and light edits.", "p"),
        ("• The markdown files remain the source of truth. After editing here, ask Claude to sync your changes back into the markdown (and Miro).", "p"),
        ("", None),
        ("Status values", "h"),
        ("Built & tested: implemented with automated tests", "p"),
        ("Built (manual test): implemented, verified by hand in the browser", "p"),
        ("Next: agreed and scheduled next (e.g. HLR-9 reward scope, migrations)", "p"),
        ("Planned: post-MVP (e.g. AI photo suggestions)", "p"),
        ("Out of scope: explicitly not being built", "p"),
        ("", None),
        ("Example register row", "h"),
        ("LLR-4.19 | Functional (LLR) | HLR-9 | Reward cards show how many days are left to keep a streak reward alive | Next | Should | Mansi", "p"),
    ]
    for r, (text, kind) in enumerate(rows, start=1):
        cell = ws.cell(row=r, column=1, value=text)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        if kind == "title":
            cell.font = Font(name=FONT, bold=True, size=16, color=INK)
        elif kind == "h":
            cell.font = Font(name=FONT, bold=True, size=12, color=INK)
            cell.fill = TITLE_FILL
        else:
            cell.font = Font(name=FONT, color=BODY)
    ws.column_dimensions["A"].width = 130


def build(output: Path = OUTPUT) -> Path:
    hlrd = parse_sections((DOCS / "HLRD.md").read_text(encoding="utf-8"))
    llrd = parse_sections((DOCS / "LLRD.md").read_text(encoding="utf-8"))
    requirements = collect_requirements([("HLRD", hlrd), ("LLRD", llrd)])

    wb = Workbook()
    readme = wb.active
    readme.title = "Read Me"
    write_readme(readme, date.today().isoformat())
    register = wb.create_sheet("Requirements Register")
    last = write_register(register, requirements)
    write_traceability(wb.create_sheet("Traceability"), requirements, last)

    used = set(wb.sheetnames)
    for prefix, sections in (("HLRD", hlrd), ("LLRD", llrd)):
        for section in sections:
            if section["title"] == "Overview":
                continue  # the metadata table at the top of each doc
            write_section(wb.create_sheet(sheet_name(prefix, section["title"], used)), section)

    for ws in wb.worksheets:
        ws.sheet_view.zoomScale = 100
    wb.calculation.fullCalcOnLoad = True  # Excel computes the Traceability formulas on open
    try:
        wb.save(output)
    except PermissionError:
        raise SystemExit(f"Can't write {output}: close it in Excel first, then run this again.") from None
    print(f"{output}  ({len(requirements)} requirements, {len(wb.sheetnames)} sheets)")
    return output


if __name__ == "__main__":
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else OUTPUT)
