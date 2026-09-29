import { useRef, useState } from "react";
import { useRewards } from "../context.js";
import { useResource } from "../lib/useResource.js";
import { ErrorState, Loading, useAction } from "./ui.jsx";

// Notes, contacts and files on a tile or an area, grouped by topic (HLR-10).

const ROLES = [
  ["customer_care", "Customer care"],
  ["service_executive", "Service executive"],
  ["technician", "Technician"],
  ["vendor", "Vendor or shop"],
  ["other", "Other"],
];
const PHONE_LABELS = [
  ["mobile", "Mobile"],
  ["landline", "Landline"],
  ["toll_free", "Toll-free"],
  ["other", "Other"],
];
const FILE_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic,.heic";
const roleLabel = (role) => ROLES.find(([v]) => v === role)?.[1] ?? role;

/** "2026-08-12" -> "12 Aug 2026", read as a local calendar date. */
function formatDay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const rupees = (amount) => `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function TopicInput({ value, onChange, suggestions, listId }) {
  return (
    <>
      <input aria-label="Topic" placeholder="Topic (optional), e.g. Bosch Dishwasher" value={value} onChange={(e) => onChange(e.target.value)} maxLength={60} list={listId} />
      <datalist id={listId}>
        {suggestions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </>
  );
}

function FormButtons({ busy, label, onCancel }) {
  return (
    <div className="rw-inline-form">
      <button type="submit" className="rw-btn rw-btn--primary" disabled={busy}>
        {busy ? "Saving…" : label}
      </button>
      <button type="button" className="rw-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────────

const blankPhone = { number: "", label: "mobile", whatsapp: false };

function ContactForm({ initial, topics, busy, onSubmit, onCancel }) {
  const [c, setC] = useState(() => ({
    topic: initial?.topic ?? "",
    name: initial?.name ?? "",
    organisation: initial?.organisation ?? "",
    role: initial?.role ?? "customer_care",
    phones: initial?.phones?.length ? initial.phones.map(({ number, label, whatsapp }) => ({ number, label, whatsapp })) : [{ ...blankPhone }],
    email: initial?.email ?? "",
    website: initial?.website ?? "",
    lastVisit: initial?.lastVisit ?? "",
    notes: initial?.notes ?? "",
  }));
  const set = (field) => (value) => setC((prev) => ({ ...prev, [field]: value }));
  const setPhone = (i, field, value) => setC((prev) => ({ ...prev, phones: prev.phones.map((p, j) => (j === i ? { ...p, [field]: value } : p)) }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      topic: c.topic.trim() || null,
      name: c.name.trim(),
      organisation: c.organisation.trim() || null,
      role: c.role,
      phones: c.phones.filter((p) => p.number.trim()).map((p) => ({ ...p, number: p.number.trim() })),
      email: c.email.trim() || null,
      website: c.website.trim() || null,
      lastVisit: c.lastVisit || null,
      notes: c.notes.trim(),
    });
  };

  return (
    <form className="rw-card rw-form" aria-label={initial ? "Edit contact" : "New contact"} onSubmit={submit}>
      <h3>{initial ? "Edit contact" : "New contact"}</h3>
      <input aria-label="Name" placeholder="Name, e.g. Bosch Customer Care or Ramesh" value={c.name} onChange={(e) => set("name")(e.target.value)} maxLength={80} required autoFocus />
      <TopicInput value={c.topic} onChange={set("topic")} suggestions={topics} listId="rw-topics-contact" />
      <div className="rw-inline-form">
        <select aria-label="Role" className="rw-select" value={c.role} onChange={(e) => set("role")(e.target.value)}>
          {ROLES.map(([v, text]) => (
            <option key={v} value={v}>
              {text}
            </option>
          ))}
        </select>
        <input aria-label="Organisation or brand" placeholder="Organisation / brand, e.g. Bosch" value={c.organisation} onChange={(e) => set("organisation")(e.target.value)} maxLength={80} />
      </div>
      <span className="rw-field-label">Phone numbers</span>
      {c.phones.map((p, i) => (
        <div key={i} className="rw-phone-row">
          <input aria-label={`Phone ${i + 1}`} type="tel" inputMode="tel" placeholder="98450 12345" value={p.number} onChange={(e) => setPhone(i, "number", e.target.value)} maxLength={30} />
          <select aria-label={`Phone ${i + 1} type`} className="rw-select" value={p.label} onChange={(e) => setPhone(i, "label", e.target.value)}>
            {PHONE_LABELS.map(([v, text]) => (
              <option key={v} value={v}>
                {text}
              </option>
            ))}
          </select>
          <label className="rw-check">
            <input type="checkbox" checked={p.whatsapp} onChange={(e) => setPhone(i, "whatsapp", e.target.checked)} />
            WhatsApp
          </label>
          {c.phones.length > 1 && (
            <button type="button" className="rw-icon-btn" aria-label={`Remove phone ${i + 1}`} onClick={() => set("phones")(c.phones.filter((_, j) => j !== i))}>
              ✕
            </button>
          )}
        </div>
      ))}
      {c.phones.length < 3 && (
        <button type="button" className="rw-link-btn" onClick={() => set("phones")([...c.phones, { ...blankPhone }])}>
          + Another number
        </button>
      )}
      <div className="rw-inline-form">
        <input aria-label="Email" type="email" placeholder="Email (optional)" value={c.email} onChange={(e) => set("email")(e.target.value)} maxLength={254} />
        <input aria-label="Website" type="url" placeholder="Website (optional)" value={c.website} onChange={(e) => set("website")(e.target.value)} maxLength={500} />
      </div>
      <label className="rw-field-label" htmlFor="rw-last-visit">
        Last visit or contact
      </label>
      <input id="rw-last-visit" type="date" value={c.lastVisit} onChange={(e) => set("lastVisit")(e.target.value)} />
      <textarea aria-label="Notes" placeholder="Notes (optional), e.g. knows the model well; ask for him" rows={2} value={c.notes} onChange={(e) => set("notes")(e.target.value)} maxLength={1000} />
      <FormButtons busy={busy} label={initial ? "Save" : "Add contact"} onCancel={onCancel} />
    </form>
  );
}

function NoteForm({ initial, topics, busy, onSubmit, onCancel }) {
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  return (
    <form
      className="rw-card rw-form"
      aria-label={initial ? "Edit note" : "New note"}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ topic: topic.trim() || null, title: title.trim() || null, body: body.trim() });
      }}
    >
      <h3>{initial ? "Edit note" : "New note"}</h3>
      <TopicInput value={topic} onChange={setTopic} suggestions={topics} listId="rw-topics-note" />
      <input aria-label="Title" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      <textarea aria-label="Note" placeholder="e.g. Filter cleaned; next service due in 6 months" rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} required autoFocus={!initial} />
      <FormButtons busy={busy} label={initial ? "Save" : "Add note"} onCancel={onCancel} />
    </form>
  );
}

function FileForm({ initial, topics, busy, onSubmit, onCancel }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [docDate, setDocDate] = useState(initial?.docDate ?? "");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const tooBig = file && file.size > 10 * 1024 * 1024;

  const submit = (e) => {
    e.preventDefault();
    const fields = { title: title.trim(), topic: topic.trim() || null, docDate: docDate || null, amount: amount === "" ? null : Number(amount) };
    if (initial) return onSubmit(fields);
    const form = new FormData();
    form.append("file", file);
    form.append("title", fields.title);
    if (fields.topic) form.append("topic", fields.topic);
    if (fields.docDate) form.append("docDate", fields.docDate);
    if (fields.amount != null) form.append("amount", String(fields.amount));
    return onSubmit(form);
  };

  return (
    <form className="rw-card rw-form" aria-label={initial ? "Edit file" : "Add a file"} onSubmit={submit}>
      <h3>{initial ? "Edit file details" : "Add a bill or document"}</h3>
      {!initial && (
        <>
          <input
            aria-label="File"
            type="file"
            accept={FILE_ACCEPT}
            required
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              setFile(picked);
              if (picked && !title) setTitle(picked.name.replace(/\.[^.]+$/, ""));
            }}
          />
          <small className={tooBig ? "rw-error-text" : "rw-muted"}>PDF, JPG, PNG, WebP or HEIC, up to 10 MB. On a phone you can take a photo.</small>
        </>
      )}
      <input aria-label="Title" placeholder="Title, e.g. Dishwasher invoice" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      <TopicInput value={topic} onChange={setTopic} suggestions={topics} listId="rw-topics-file" />
      <div className="rw-inline-form">
        <input aria-label="Date on the document" type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
        <input aria-label="Amount in rupees" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Amount ₹ (optional)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <FormButtons busy={busy || tooBig} label={initial ? "Save" : "Upload"} onCancel={onCancel} />
    </form>
  );
}

// ── Display ───────────────────────────────────────────────────────────────────

function copyNumber(number, toast) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(number).then(() => toast(`Copied ${number}`), () => toast(number));
  } else {
    toast(number);
  }
}

function ItemActions({ label, onEdit, onDelete }) {
  return (
    <div className="rw-row-actions">
      <button type="button" className="rw-icon-btn" aria-label={`Edit ${label}`} onClick={onEdit}>
        ✎
      </button>
      <button type="button" className="rw-icon-btn" aria-label={`Delete ${label}`} onClick={onDelete}>
        🗑
      </button>
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete }) {
  const { toast } = useRewards();
  return (
    <li className="rw-card rw-contact">
      <div className="rw-item-head">
        <div>
          <strong>{contact.name}</strong>
          <small className="rw-muted">
            {roleLabel(contact.role)}
            {contact.organisation && ` · ${contact.organisation}`}
            {contact.lastVisit && ` · last visit ${formatDay(contact.lastVisit)}`}
          </small>
        </div>
        <ItemActions label={contact.name} onEdit={onEdit} onDelete={onDelete} />
      </div>
      {contact.phones.map((p) => (
        <div key={p.number} className="rw-phone">
          <span className="rw-phone-number">
            {p.number} <small className="rw-muted">{PHONE_LABELS.find(([v]) => v === p.label)?.[1]}</small>
          </span>
          <a className="rw-btn rw-btn--small rw-btn--primary" href={`tel:${p.tel}`}>
            Call
          </a>
          {p.whatsappUrl && (
            <a className="rw-btn rw-btn--small" href={p.whatsappUrl} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
          <button type="button" className="rw-btn rw-btn--small" onClick={() => copyNumber(p.number, toast)}>
            Copy
          </button>
        </div>
      ))}
      {(contact.email || contact.website) && (
        <div className="rw-phone">
          {contact.email && (
            <a className="rw-btn rw-btn--small" href={`mailto:${contact.email}`}>
              Email
            </a>
          )}
          {contact.website && (
            <a className="rw-btn rw-btn--small" href={contact.website} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          )}
        </div>
      )}
      {contact.notes && <p className="rw-muted rw-prewrap">{contact.notes}</p>}
    </li>
  );
}

function FileCard({ file, onEdit, onDelete }) {
  const { api } = useRewards();
  const href = api.fileUrl(file.url);
  return (
    <li className="rw-card rw-file">
      <a className="rw-file-thumb" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.title}`}>
        {file.isImage ? <img src={href} alt="" loading="lazy" /> : <span aria-hidden="true">📄</span>}
      </a>
      <div className="rw-file-body">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <strong>{file.title}</strong>
        </a>
        <small className="rw-muted">{[formatDay(file.docDate), file.amount != null && rupees(file.amount)].filter(Boolean).join(" · ") || file.originalName}</small>
      </div>
      <ItemActions label={file.title} onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}

function NoteCard({ note, onEdit, onDelete }) {
  const edited = new Date(note.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className="rw-card rw-note">
      <div className="rw-item-head">
        <strong>{note.title || "Note"}</strong>
        <ItemActions label={note.title || "note"} onEdit={onEdit} onDelete={onDelete} />
      </div>
      <p className="rw-prewrap">{note.body}</p>
      <small className="rw-muted">Edited {edited}</small>
    </li>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function DetailsPanel({ ownerType, ownerId }) {
  const { api, toast } = useRewards();
  const details = useResource(() => api.details(ownerType, ownerId), [api, ownerType, ownerId]);
  // `form` is { kind: "contact" | "note" | "file", item?: existing item being edited }
  const [form, setForm] = useState(null);
  const [busy, run] = useAction(toast);

  if (details.loading && details.data === undefined) return <Loading label="Loading notes and contacts…" />;
  if (details.error && details.data === undefined) return <ErrorState error={details.error} onRetry={details.reload} />;
  const data = details.data;
  const topics = data.topicNames;

  const done = () => (setForm(null), details.refresh());
  const save = async (kind, payload) => {
    const item = form?.item;
    const calls = {
      contact: () => (item ? api.updateContact(item.id, payload) : api.addContact(ownerType, ownerId, payload)),
      note: () => (item ? api.updateNote(item.id, payload) : api.addNote(ownerType, ownerId, payload)),
      file: () => (item ? api.updateFile(item.id, payload) : api.uploadFile(ownerType, ownerId, payload)),
    };
    if (await run(calls[kind], item ? "Saved" : { contact: "Contact added", note: "Note added", file: "File uploaded" }[kind])) done();
  };
  const remove = async (kind, item, label) => {
    if (!window.confirm(`Delete ${label}?`)) return;
    const calls = { contact: api.deleteContact, note: api.deleteNote, file: api.deleteFile };
    if (await run(async () => (await calls[kind](item.id), true), `Deleted ${label}`)) details.refresh();
  };
  const formProps = { topics, busy, onCancel: () => setForm(null), onSubmit: (payload) => save(form.kind, payload) };

  return (
    <div className="rw-details">
      <div className="rw-inline-form rw-details-actions">
        <button type="button" className="rw-btn rw-btn--primary" onClick={() => setForm({ kind: "contact" })}>
          + Contact
        </button>
        <button type="button" className="rw-btn" onClick={() => setForm({ kind: "file" })}>
          + File
        </button>
        <button type="button" className="rw-btn" onClick={() => setForm({ kind: "note" })}>
          + Note
        </button>
      </div>

      {form?.kind === "contact" && <ContactForm key={form.item?.id ?? "new"} initial={form.item} {...formProps} />}
      {form?.kind === "note" && <NoteForm key={form.item?.id ?? "new"} initial={form.item} {...formProps} />}
      {form?.kind === "file" && <FileForm key={form.item?.id ?? "new"} initial={form.item} {...formProps} />}

      {data.topics.length === 0 && !form ? (
        <div className="rw-state rw-state--empty">
          <strong>No notes or contacts yet</strong>
          <p>Add a customer-care number, the last executive or a bill.</p>
        </div>
      ) : (
        data.topics.map((group) => (
          <section key={group.topic ?? "general"} className="rw-topic" aria-label={group.topic ?? "General"}>
            <div className="rw-topic-head">
              <h3>{group.topic ?? "General"}</h3>
              {group.lastExecutive && (
                <div className="rw-last-exec">
                  <span>
                    Last executive: <strong>{group.lastExecutive.name}</strong>
                    {group.lastExecutive.lastVisit && `, ${formatDay(group.lastExecutive.lastVisit)}`}
                  </span>
                  {group.lastExecutive.phones[0] && (
                    <a className="rw-btn rw-btn--small rw-btn--primary" href={`tel:${group.lastExecutive.phones[0].tel}`}>
                      Call
                    </a>
                  )}
                </div>
              )}
            </div>
            <ul className="rw-detail-list">
              {group.contacts.map((c) => (
                <ContactCard key={`c${c.id}`} contact={c} onEdit={() => setForm({ kind: "contact", item: c })} onDelete={() => remove("contact", c, c.name)} />
              ))}
              {group.files.map((f) => (
                <FileCard key={`f${f.id}`} file={f} onEdit={() => setForm({ kind: "file", item: f })} onDelete={() => remove("file", f, f.title)} />
              ))}
              {group.notes.map((n) => (
                <NoteCard key={`n${n.id}`} note={n} onEdit={() => setForm({ kind: "note", item: n })} onDelete={() => remove("note", n, n.title || "this note")} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

// ── Search (tiles screen) ─────────────────────────────────────────────────────

const KIND_ICON = { contact: "📞", note: "📝", file: "📄" };

export function DetailsSearch() {
  const { api, links } = useRewards();
  const [q, setQ] = useState("");
  const [state, setState] = useState({ query: "", hits: [], loading: false, error: null });
  const latest = useRef("");

  const runSearch = async (value) => {
    setQ(value);
    const query = value.trim();
    latest.current = query;
    if (query.length < 2) return setState({ query: "", hits: [], loading: false, error: null });
    setState((s) => ({ ...s, loading: true }));
    try {
      const hits = await api.search(query);
      if (latest.current === query) setState({ query, hits, loading: false, error: null }); // ignore older keystrokes
    } catch (error) {
      if (latest.current === query) setState({ query, hits: [], loading: false, error });
    }
  };

  return (
    <div className="rw-search">
      <input type="search" aria-label="Search notes and contacts" placeholder="Search contacts, notes, bills… (name, brand or number)" value={q} onChange={(e) => runSearch(e.target.value)} />
      {state.error && <ErrorState error={state.error} onRetry={() => runSearch(q)} />}
      {state.query && !state.loading && !state.error && state.hits.length === 0 && <p className="rw-muted">Nothing found for “{state.query}”.</p>}
      {state.hits.length > 0 && (
        <ul className="rw-list" aria-label="Search results">
          {state.hits.map((h) => (
            <li key={`${h.kind}${h.id}`} className="rw-row">
              <a className="rw-row-main" href={links.details(h.ownerType, h.ownerId)}>
                <strong>
                  {KIND_ICON[h.kind]} {h.title}
                </strong>
                <small>
                  {h.path}
                  {h.topic && ` › ${h.topic}`}
                  {h.snippet && ` · ${h.snippet}`}
                </small>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
