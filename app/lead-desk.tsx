"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import "./lead-desk.css";

type Lead = {
  id: number;
  contactName: string;
  organization: string;
  email: string;
  phone: string;
  country: string;
  caseType: string;
  source: string;
  stage: string;
  applicationOpened: boolean;
  status: string;
  nextAction: string;
  followUpDate: string;
  summary: string;
  emailDraft: string;
  tags: string;
  createdAt: string;
};
type Activity = {
  id: number;
  leadId: number;
  kind: string;
  note: string;
  createdAt: string;
};
type View =
  | "attention"
  | "todo"
  | "all"
  | "programmes"
  | "partnerships"
  | "converted"
  | "closed";

const caseTypes = [
  "Student / parent enquiry",
  "Agent partnership",
  "School partnership",
  "Exchange / immersion",
  "Campus / group visit",
];
const sources = ["Walk In", "Agent"];
const walkInMethods = ["Call", "Email", "Website form", "Social", "Referral"];
const tagOptions = [
  {
    key: "hot",
    label: "Hot lead",
    colour: "coral",
    meaning: "High potential — prioritise this lead",
  },
  {
    key: "urgent",
    label: "Urgent",
    colour: "amber",
    meaning: "Time-sensitive action is required",
  },
  {
    key: "vip",
    label: "VIP",
    colour: "navy",
    meaning: "Important relationship or key decision-maker",
  },
  {
    key: "waiting",
    label: "Waiting",
    colour: "teal",
    meaning: "Waiting for the contact to respond",
  },
  {
    key: "watch",
    label: "Watch",
    colour: "cream",
    meaning: "Keep visible, but no immediate action",
  },
];
const actionTypes = [
  "Email sent",
  "Email received",
  "Meeting",
  "Phone call",
  "WhatsApp",
  "Walk-in",
  "Note",
];
const stageMap: Record<string, string[]> = {
  "Student / parent enquiry": [
    "New enquiry",
    "Replied",
    "Documents requested",
    "Test proposed",
    "Placement test booked",
    "Application fee paid",
    "Enrolled",
    "Joined",
  ],
  "Agent partnership": [
    "New lead",
    "Contacted",
    "Meeting proposed",
    "Meeting completed",
    "Negotiating",
    "Agreement signed",
    "Active",
  ],
  "School partnership": [
    "New lead",
    "Contacted",
    "Meeting proposed",
    "Meeting completed",
    "Negotiating",
    "Agreement signed",
    "Active",
  ],
  "Exchange / immersion": [
    "New request",
    "Replied",
    "Requirements gathered",
    "Date proposed",
    "Quotation sent",
    "Awaiting confirmation",
    "Programme confirmed",
    "Completed",
  ],
  "Campus / group visit": [
    "New request",
    "Replied",
    "Requirements gathered",
    "Date proposed",
    "Quotation sent",
    "Awaiting confirmation",
    "Programme confirmed",
    "Completed",
  ],
};

function makeBlank() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return {
    contactName: "",
    organization: "",
    email: "",
    phone: "",
    country: "",
    caseType: caseTypes[0],
    source: sources[0],
    contactMethod: walkInMethods[0],
    agentName: "",
    stage: "New enquiry",
    applicationOpened: false,
    nextAction: "Reply to enquiry",
    followUpDate: d.toLocaleDateString("sv-SE", { timeZone: "Asia/Singapore" }),
    summary: "",
    emailDraft: "",
    tags: "[]",
  };
}
const AGENT_PREFIX = "Agent · ";
const WALK_IN_PREFIX = "Walk In · ";
function sourceType(source: string) {
  return source === "Agent" || source.startsWith(AGENT_PREFIX)
    ? "Agent"
    : "Walk In";
}
function agentFromSource(source: string) {
  return source.startsWith(AGENT_PREFIX)
    ? source.slice(AGENT_PREFIX.length)
    : "";
}
function walkInMethodFromSource(source: string) {
  if (source.startsWith(WALK_IN_PREFIX)) {
    return source.slice(WALK_IN_PREFIX.length);
  }
  if (["Outlook email", "Email"].includes(source)) return "Email";
  if (source === "Website form") return "Website form";
  if (["Phone", "Walk-in / phone"].includes(source)) return "Call";
  if (["Social media", "WhatsApp"].includes(source)) return "Social";
  if (["Staff referral", "Staff / agent referral"].includes(source)) {
    return "Referral";
  }
  return walkInMethods[0];
}
function currentCaseType(caseType: string) {
  if (caseTypes.includes(caseType)) return caseType;
  if (caseType === "Walk-in enquiry") return "Student / parent enquiry";
  return "Agent partnership";
}
function readTags(value: string | undefined) {
  try {
    return JSON.parse(value || "[]") as string[];
  } catch {
    return [];
  }
}

function ContactCell({ lead }: { lead: Lead }) {
  return (
    <span className="contact">
      <i>
        {lead.contactName
          .split(" ")
          .map((x) => x[0])
          .join("")
          .slice(0, 2)}
      </i>
      <b>
        {lead.contactName}
        <small>
          {lead.organization || lead.country || "Individual enquiry"}
        </small>
        <span className="rowTags">
          {readTags(lead.tags).map((key) => {
            const tag = tagOptions.find((option) => option.key === key);
            return tag ? (
              <span
                key={key}
                className={`rowTag tag-${tag.colour}`}
                title={tag.label}
              >
                <i></i>
                {tag.label}
              </span>
            ) : null;
          })}
        </span>
        {lead.caseType === "Student / parent enquiry" && (
          <span
            className={`applicationBadge ${lead.applicationOpened ? "opened" : "notOpened"}`}
          >
            {lead.applicationOpened
              ? "Application opened"
              : "Application not opened"}
          </span>
        )}
      </b>
    </span>
  );
}

function SourceCell({ lead }: { lead: Lead }) {
  return (
    <span>
      <small className="sourcePill">
        {sourceType(lead.source) === "Agent"
          ? agentFromSource(lead.source)
            ? `Agent · ${agentFromSource(lead.source)}`
            : "Agent"
          : `Walk In · ${walkInMethodFromSource(lead.source)}`}
      </small>
    </span>
  );
}

export default function LeadDesk() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<View>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(makeBlank);
  const [query, setQuery] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [completing, setCompleting] = useState<Lead | null>(null);
  const [completionChoice, setCompletionChoice] = useState<
    "followup" | "converted" | "closed"
  >("followup");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [closeReason, setCloseReason] = useState("No response");
  const [notice, setNotice] = useState("");
  const [online, setOnline] = useState(false);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [actionType, setActionType] = useState(actionTypes[0]);
  const [actionNote, setActionNote] = useState("");
  const selectedId = selected?.id;
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Singapore",
  });
  const nextSevenDate = new Date();
  nextSevenDate.setDate(nextSevenDate.getDate() + 7);
  const nextSeven = nextSevenDate.toLocaleDateString("sv-SE", {
    timeZone: "Asia/Singapore",
  });
  const todayLabel = new Date()
    .toLocaleDateString("en-SG", {
      timeZone: "Asia/Singapore",
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setOnline(true);
        setLeads(d.leads ?? []);
      })
      .catch(() => setOnline(false));
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/activities?leadId=${selectedId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setActivitiesList(d.activities ?? []))
      .catch(() => setActivitiesList([]));
  }, [selectedId]);

  const overdue = leads.filter(
    (l) => l.status === "active" && l.followUpDate < today,
  ).length;
  const dueToday = leads.filter(
    (l) => l.status === "active" && l.followUpDate === today,
  ).length;
  const capturedSinceStart = leads.filter(
    (lead) => lead.createdAt.slice(0, 10) >= "2026-08-17",
  ).length;
  const agentNames = Array.from(
    new Set(leads.map((lead) => agentFromSource(lead.source)).filter(Boolean)),
  ).sort();
  const availableStages =
    caseFilter === "all"
      ? Array.from(new Set(leads.map((lead) => lead.stage))).sort()
      : (stageMap[caseFilter] ?? []);
  const filtered = useMemo(() => {
    const rows = leads.filter((l) => {
      const matches =
        !query ||
        `${l.contactName} ${l.organization} ${l.country} ${l.nextAction}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesCase = caseFilter === "all" || l.caseType === caseFilter;
      const matchesStage = stageFilter === "all" || l.stage === stageFilter;
      const matchesSource =
        sourceFilter === "all" || sourceType(l.source) === sourceFilter;
      const matchesMethod =
        methodFilter === "all" ||
        (sourceType(l.source) === "Walk In" &&
          walkInMethodFromSource(l.source) === methodFilter);
      const matchesTag =
        tagFilter === "all" || readTags(l.tags).includes(tagFilter);
      const matchesApplication =
        applicationFilter === "all" ||
        (l.caseType === "Student / parent enquiry" &&
          (applicationFilter === "opened"
            ? l.applicationOpened
            : !l.applicationOpened));
      const matchesDue =
        dueFilter === "all" ||
        (dueFilter === "overdue" &&
          Boolean(l.followUpDate) &&
          l.followUpDate < today) ||
        (dueFilter === "today" && l.followUpDate === today) ||
        (dueFilter === "next7" &&
          l.followUpDate > today &&
          l.followUpDate <= nextSeven) ||
        (dueFilter === "later" && l.followUpDate > nextSeven) ||
        (dueFilter === "nodate" && !l.followUpDate);
      const matchesFilters =
        matches &&
        matchesCase &&
        matchesStage &&
        matchesSource &&
        matchesMethod &&
        matchesTag &&
        matchesApplication &&
        matchesDue;
      if (view === "attention")
        return (
          matchesFilters && l.status === "active" && l.followUpDate <= today
        );
      if (view === "todo")
        return matchesFilters && l.status === "active" && Boolean(l.nextAction);
      if (view === "converted")
        return matchesFilters && l.status === "converted";
      if (view === "closed") return matchesFilters && l.status === "closed";
      if (view === "programmes")
        return (
          matchesFilters &&
          l.status === "active" &&
          ["Exchange / immersion", "Campus / group visit"].includes(l.caseType)
        );
      if (view === "partnerships")
        return (
          matchesFilters &&
          l.status === "active" &&
          l.caseType.includes("partnership")
        );
      return matchesFilters && l.status === "active";
    });
    return view === "todo"
      ? [...rows].sort((a, b) =>
          (a.followUpDate || "9999").localeCompare(b.followUpDate || "9999"),
        )
      : rows;
  }, [
    leads,
    view,
    query,
    today,
    nextSeven,
    caseFilter,
    stageFilter,
    dueFilter,
    sourceFilter,
    methodFilter,
    tagFilter,
    applicationFilter,
  ]);

  function updateType(type: string) {
    setForm({ ...form, caseType: type, stage: stageMap[type][0] });
  }
  async function addLead(e: FormEvent) {
    e.preventDefault();
    const duplicate = leads.find(
      (l) =>
        (form.email && l.email.toLowerCase() === form.email.toLowerCase()) ||
        (l.contactName.toLowerCase() === form.contactName.toLowerCase() &&
          l.organization.toLowerCase() === form.organization.toLowerCase()),
    );
    if (duplicate) {
      setShowAdd(false);
      setSelected({
        ...duplicate,
        caseType: currentCaseType(duplicate.caseType),
      });
      setNotice(
        "Possible duplicate found. Opened the existing contact instead.",
      );
      setTimeout(() => setNotice(""), 4200);
      return;
    }
    const r = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        source:
          form.source === "Agent" && form.agentName.trim()
            ? `${AGENT_PREFIX}${form.agentName.trim()}`
            : `${WALK_IN_PREFIX}${form.contactMethod}`,
      }),
    });
    if (r.ok) {
      const d = await r.json();
      setLeads((x) => [d.lead, ...x]);
    }
    setShowAdd(false);
    setForm(makeBlank());
    setNotice("Lead captured. Next action is now tracked.");
    setTimeout(() => setNotice(""), 3200);
  }
  function startCompletion(
    lead: Lead,
    choice: "followup" | "converted" | "closed" = "followup",
  ) {
    setCompleting(lead);
    setCompletionChoice(choice);
    setNextFollowUp("");
    setNextFollowUpDate("");
    setCloseReason("No response");
  }

  async function recordActivity(leadId: number, kind: string, note: string) {
    return fetch("/api/activities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId, kind, note }),
    });
  }

  async function completeFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!completing) return;
    if (
      completionChoice === "followup" &&
      (!nextFollowUp.trim() || !nextFollowUpDate)
    ) {
      setNotice("Add the next action and follow-up date.");
      setTimeout(() => setNotice(""), 2800);
      return;
    }

    const completedNote = completing.nextAction.trim() || "Follow-up action";
    const activityResponse = await recordActivity(
      completing.id,
      "Follow-up completed",
      completedNote,
    );
    if (!activityResponse.ok) {
      setNotice("Could not record the completed follow-up.");
      setTimeout(() => setNotice(""), 3200);
      return;
    }

    const update =
      completionChoice === "followup"
        ? {
            status: "active",
            nextAction: nextFollowUp.trim(),
            followUpDate: nextFollowUpDate,
          }
        : completionChoice === "converted"
          ? { status: "converted", nextAction: "", followUpDate: "" }
          : { status: "closed", nextAction: "", followUpDate: "" };
    const r = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: completing.id,
        ...update,
      }),
    });
    if (!r.ok) {
      setNotice("The follow-up was recorded, but the lead could not update.");
      setTimeout(() => setNotice(""), 3200);
      return;
    }
    const d = await r.json();
    const updated = d.lead ?? { ...completing, ...update };
    if (completionChoice === "closed") {
      await recordActivity(completing.id, "Lead closed", closeReason);
    }
    setLeads((x) => x.map((l) => (l.id === completing.id ? updated : l)));
    setCompleting(null);
    setSelected(null);
    setActivitiesList([]);
    setView(
      completionChoice === "converted"
        ? "converted"
        : completionChoice === "closed"
          ? "closed"
          : "todo",
    );
    setNotice(
      completionChoice === "converted"
        ? "Follow-up completed and lead converted."
        : completionChoice === "closed"
          ? "Follow-up completed and lead closed."
          : "Follow-up completed. The next action is now in your to-do list.",
    );
    setTimeout(() => setNotice(""), 2800);
  }
  async function saveCase() {
    if (!selected) return;
    const r = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        contactName: selected.contactName,
        organization: selected.organization,
        email: selected.email,
        phone: selected.phone,
        country: selected.country,
        caseType: selected.caseType,
        source: selected.source,
        stage: selected.stage,
        applicationOpened: selected.applicationOpened,
        status: selected.status,
        nextAction: selected.nextAction,
        followUpDate: selected.followUpDate,
        summary: selected.summary,
        tags: selected.tags,
      }),
    });
    if (!r.ok) {
      setNotice("Could not save this case. Please try again.");
      setTimeout(() => setNotice(""), 3200);
      return;
    }
    const d = await r.json();
    const saved = d.lead ?? selected;
    setLeads((x) => x.map((l) => (l.id === saved.id ? saved : l)));
    setSelected(null);
    setActivitiesList([]);
    setNotice("Contact and case details updated.");
    setTimeout(() => setNotice(""), 2800);
  }
  async function updateStage() {
    if (!selected) return;
    const savedLead = leads.find((lead) => lead.id === selected.id);
    const previousStage = savedLead?.stage ?? "Previous stage";
    if (previousStage === selected.stage) {
      setNotice("This lead is already at that stage.");
      setTimeout(() => setNotice(""), 2600);
      return;
    }
    const response = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: selected.id, stage: selected.stage }),
    });
    if (!response.ok) {
      setNotice("Could not update the pipeline stage.");
      setTimeout(() => setNotice(""), 3200);
      return;
    }
    const data = await response.json();
    const updated = data.lead ?? selected;
    setLeads((current) =>
      current.map((lead) => (lead.id === updated.id ? updated : lead)),
    );
    setSelected(updated);
    const activityResponse = await recordActivity(
      selected.id,
      "Stage updated",
      `${previousStage} → ${selected.stage}`,
    );
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      setActivitiesList((current) => [activityData.activity, ...current]);
    }
    setNotice(`Stage updated to ${selected.stage}.`);
    setTimeout(() => setNotice(""), 2800);
  }
  async function updateApplicationOpened(applicationOpened: boolean) {
    if (!selected) return;
    const response = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: selected.id, applicationOpened }),
    });
    if (!response.ok) {
      setNotice("Could not update the application status.");
      setTimeout(() => setNotice(""), 3200);
      return;
    }
    const data = await response.json();
    const updated = data.lead ?? { ...selected, applicationOpened };
    setLeads((current) =>
      current.map((lead) => (lead.id === updated.id ? updated : lead)),
    );
    setSelected(updated);
    const note = applicationOpened
      ? "Parent opened the online application."
      : "Application marked as not opened.";
    const activityResponse = await recordActivity(
      selected.id,
      "Application status updated",
      note,
    );
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      setActivitiesList((current) => [activityData.activity, ...current]);
    }
    setNotice(
      applicationOpened
        ? "Application marked as opened."
        : "Application marked as not opened.",
    );
    setTimeout(() => setNotice(""), 2800);
  }
  async function deleteCase() {
    if (!selected) return;
    if (
      !window.confirm(
        `Delete ${selected.contactName}? This also removes the contact history and cannot be undone.`,
      )
    )
      return;
    const id = selected.id;
    const r = await fetch("/api/leads", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!r.ok) {
      setNotice("Could not delete this case. Please try again.");
      setTimeout(() => setNotice(""), 3200);
      return;
    }
    setLeads((x) => x.filter((l) => l.id !== id));
    setSelected(null);
    setActivitiesList([]);
    setNotice("Case deleted.");
    setTimeout(() => setNotice(""), 2800);
  }
  function toggleTag(key: string) {
    if (!selected) return;
    const current = readTags(selected.tags);
    const next = current.includes(key)
      ? current.filter((x) => x !== key)
      : [...current, key];
    setSelected({ ...selected, tags: JSON.stringify(next) });
  }
  async function addActivity(e: FormEvent) {
    e.preventDefault();
    if (!selected || !actionNote.trim()) return;
    const r = await fetch("/api/activities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leadId: selected.id,
        kind: actionType,
        note: actionNote.trim(),
      }),
    });
    if (r.ok) {
      const d = await r.json();
      setActivitiesList((x) => [d.activity, ...x]);
    }
    setActionNote("");
    setNotice("Contact action added to the timeline.");
    setTimeout(() => setNotice(""), 2800);
  }
  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">E</span>
          <div>
            <b>Edy’s Lead Desk</b>
            <small>SFMS follow-up workspace</small>
          </div>
        </div>
        <nav>
          <button
            className={view === "todo" ? "active" : ""}
            onClick={() => setView("todo")}
          >
            <span>✓</span>To-do list{" "}
            <em>
              {
                leads.filter(
                  (l) => l.status === "active" && Boolean(l.nextAction),
                ).length
              }
            </em>
          </button>
          <button
            className={`${view === "attention" ? "active " : ""}${overdue + dueToday > 0 ? "attentionAlert" : ""}`}
            onClick={() => setView("attention")}
          >
            <span>!</span>Needs attention <em>{overdue + dueToday}</em>
          </button>
          <button
            className={view === "all" ? "active" : ""}
            onClick={() => setView("all")}
          >
            <span>▦</span>All cases
          </button>
          <button
            className={view === "programmes" ? "active" : ""}
            onClick={() => setView("programmes")}
          >
            <span>◇</span>Programmes
          </button>
          <button
            className={view === "partnerships" ? "active" : ""}
            onClick={() => setView("partnerships")}
          >
            <span>⌁</span>Partnerships
          </button>
          <button
            className={view === "converted" ? "active" : ""}
            onClick={() => setView("converted")}
          >
            <span>✓</span>Converted
          </button>
          <button
            className={view === "closed" ? "active" : ""}
            onClick={() => setView("closed")}
          >
            <span>×</span>Closed
          </button>
        </nav>
        <div className="sidebarFoot">
          <span className="avatar">EA</span>
          <div>
            <b>Edy Aung</b>
            <small>
              {online ? "Secure database connected" : "Preview mode"}
            </small>
          </div>
        </div>
      </aside>
      <main className="main">
        <header>
          <div>
            <p className="eyebrow">{todayLabel}</p>
            <h1>Good morning, Edy.</h1>
            <p>
              Here’s what needs your attention before any lead slips through.
            </p>
          </div>
          <button className="primary" onClick={() => setShowAdd(true)}>
            ＋ Capture new lead
          </button>
        </header>
        <section className="metrics">
          <article className="urgent">
            <span>OVERDUE</span>
            <strong>{overdue}</strong>
            <p>Needs immediate follow-up</p>
          </article>
          <article>
            <span>DUE TODAY</span>
            <strong>{dueToday}</strong>
            <p>Actions due before end of day</p>
          </article>
          <article>
            <span>NEW THIS MONTH</span>
            <strong>{capturedSinceStart}</strong>
            <p>Captured since 17 August</p>
          </article>
          <article>
            <span>UPCOMING PROGRAMMES</span>
            <strong>
              {leads.filter((l) => l.stage === "Programme confirmed").length}
            </strong>
            <p>Formally confirmed</p>
          </article>
        </section>
        <section className="tagLegend">
          <div>
            <span className="legendTitle">TAG LEGEND</span>
            <small>
              Use tags as quick visual markers. They do not change the pipeline
              stage.
            </small>
          </div>
          <div className="legendItems">
            {tagOptions.map((t) => (
              <span key={t.key} className={`legendItem tag-${t.colour}`}>
                <i></i>
                <b>{t.label}</b>
                <em>{t.meaning}</em>
              </span>
            ))}
          </div>
        </section>
        <section className="work">
          <div className="sectionHead">
            <div>
              <h2>
                {view === "attention"
                  ? "Follow-up queue"
                  : view === "todo"
                    ? "To-do list"
                    : view === "all"
                      ? "All cases"
                      : view === "programmes"
                        ? "Programme pipeline"
                        : view === "partnerships"
                          ? "Partnership pipeline"
                          : view === "converted"
                            ? "Converted leads"
                            : "Closed leads"}
              </h2>
              <p>
                {filtered.length}{" "}
                {view === "todo"
                  ? filtered.length === 1
                    ? "active task"
                    : "active tasks"
                  : filtered.length === 1
                    ? "case"
                    : "cases"}{" "}
                shown
              </p>
            </div>
            <label className="search">
              ⌕
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contact, organisation or action"
              />
            </label>
          </div>
          <div className="filterBar">
            <label>
              Case type
              <select
                value={caseFilter}
                onChange={(e) => {
                  setCaseFilter(e.target.value);
                  setStageFilter("all");
                }}
              >
                <option value="all">All case types</option>
                {caseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Stage
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              >
                <option value="all">All stages</option>
                {availableStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Follow-up urgency
              <select
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value)}
              >
                <option value="all">Any follow-up date</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="next7">Next 7 days</option>
                <option value="later">Later</option>
                <option value="nodate">No date set</option>
              </select>
            </label>
            <label>
              Source
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  if (e.target.value === "Agent") setMethodFilter("all");
                }}
              >
                <option value="all">All sources</option>
                {sources.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </label>
            <label>
              Walk In method
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                disabled={sourceFilter === "Agent"}
              >
                <option value="all">All methods</option>
                {walkInMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>
            <label>
              Tag
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              >
                <option value="all">All tags</option>
                {tagOptions.map((tag) => (
                  <option key={tag.key} value={tag.key}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Application
              <select
                value={applicationFilter}
                onChange={(e) => setApplicationFilter(e.target.value)}
              >
                <option value="all">Any application status</option>
                <option value="not_opened">Not opened</option>
                <option value="opened">Opened</option>
              </select>
            </label>
            {(caseFilter !== "all" ||
              stageFilter !== "all" ||
              dueFilter !== "all" ||
              sourceFilter !== "all" ||
              methodFilter !== "all" ||
              tagFilter !== "all" ||
              applicationFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setCaseFilter("all");
                  setStageFilter("all");
                  setDueFilter("all");
                  setSourceFilter("all");
                  setMethodFilter("all");
                  setTagFilter("all");
                  setApplicationFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="table">
            <div
              className={`tableRow tableHeader ${view === "todo" ? "todoRow" : ""}`}
            >
              {view === "todo" ? (
                <>
                  <span>Due</span>
                  <span>Follow-up action</span>
                  <span>Contact</span>
                  <span>Case</span>
                  <span>Source</span>
                  <span>Stage</span>
                  <span></span>
                </>
              ) : (
                <>
                  <span>Contact</span>
                  <span>Case</span>
                  <span>Source</span>
                  <span>Stage</span>
                  <span>Next action</span>
                  <span>Due</span>
                  <span></span>
                </>
              )}
            </div>
            {filtered.length ? (
              filtered.map((lead) => (
                <div
                  className={`tableRow leadRow ${view === "todo" ? "todoRow" : ""}`}
                  key={lead.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setSelected({
                      ...lead,
                      caseType: currentCaseType(lead.caseType),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelected({
                        ...lead,
                        caseType: currentCaseType(lead.caseType),
                      });
                    }
                  }}
                >
                  {view === "todo" ? (
                    <>
                      <span
                        className={
                          lead.followUpDate < today ? "date overdue" : "date"
                        }
                      >
                        {lead.followUpDate === today
                          ? "Today"
                          : lead.followUpDate || "—"}
                      </span>
                      <span className="actionCell">{lead.nextAction}</span>
                      <ContactCell lead={lead} />
                      <span>
                        <small className="typePill">{lead.caseType}</small>
                      </span>
                      <SourceCell lead={lead} />
                      <span>
                        <small className="stagePill">{lead.stage}</small>
                      </span>
                    </>
                  ) : (
                    <>
                      <ContactCell lead={lead} />
                      <span>
                        <small className="typePill">{lead.caseType}</small>
                      </span>
                      <SourceCell lead={lead} />
                      <span>
                        <small className="stagePill">{lead.stage}</small>
                      </span>
                      <span className="actionCell">{lead.nextAction}</span>
                      <span
                        className={
                          lead.followUpDate < today ? "date overdue" : "date"
                        }
                      >
                        {lead.followUpDate === today
                          ? "Today"
                          : lead.followUpDate || "—"}
                      </span>
                    </>
                  )}
                  <span className="rowControl">
                    {view === "todo" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startCompletion(lead);
                        }}
                      >
                        ✓ Done
                      </button>
                    ) : (
                      <span className="arrow">›</span>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty">
                <b>You’re clear.</b>
                <p>No cases match this view.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      {showAdd && (
        <div className="overlay" onMouseDown={() => setShowAdd(false)}>
          <form
            className="modal"
            onSubmit={addLead}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modalHead">
              <div>
                <p className="eyebrow">QUICK CAPTURE</p>
                <h2>Add a new lead</h2>
                <p>Only the essentials. You can add more context later.</p>
              </div>
              <button type="button" onClick={() => setShowAdd(false)}>
                ×
              </button>
            </div>
            <div className="formGrid">
              <label>
                Contact name*
                <input
                  required
                  value={form.contactName}
                  onChange={(e) =>
                    setForm({ ...form, contactName: e.target.value })
                  }
                  placeholder="e.g. Irene Hsu"
                />
              </label>
              <label>
                Organisation
                <input
                  value={form.organization}
                  onChange={(e) =>
                    setForm({ ...form, organization: e.target.value })
                  }
                  placeholder="School, agency or company"
                />
              </label>
              <label>
                Case type*
                <select
                  value={form.caseType}
                  onChange={(e) => updateType(e.target.value)}
                >
                  {caseTypes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Source*
                <select
                  value={form.source}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source: e.target.value,
                      agentName:
                        e.target.value === "Agent" ? form.agentName : "",
                    })
                  }
                >
                  {sources.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              {form.source === "Walk In" && (
                <label>
                  Walk In method*
                  <select
                    value={form.contactMethod}
                    onChange={(e) =>
                      setForm({ ...form, contactMethod: e.target.value })
                    }
                  >
                    {walkInMethods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                </label>
              )}
              {form.source === "Agent" && (
                <label>
                  Agent name*
                  <input
                    required
                    list="capture-agent-names"
                    value={form.agentName}
                    onChange={(e) =>
                      setForm({ ...form, agentName: e.target.value })
                    }
                    placeholder="Type or select an agent"
                  />
                  <datalist id="capture-agent-names">
                    {agentNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </label>
              )}
              <label>
                Country
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="e.g. Indonesia"
                />
              </label>
              <label>
                Current stage*
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                >
                  {stageMap[form.caseType].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                Next action*
                <input
                  required
                  value={form.nextAction}
                  onChange={(e) =>
                    setForm({ ...form, nextAction: e.target.value })
                  }
                  placeholder="What must happen next?"
                />
              </label>
              <label>
                Follow-up date*
                <input
                  required
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) =>
                    setForm({ ...form, followUpDate: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Email or conversation summary
                <textarea
                  value={form.summary}
                  onChange={(e) =>
                    setForm({ ...form, summary: e.target.value })
                  }
                  placeholder="Paste the key points or the original email here…"
                />
              </label>
            </div>
            <div className="modalFoot">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button className="primary">Capture lead</button>
            </div>
          </form>
        </div>
      )}
      {selected && (
        <div
          className="caseOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.contactName} case details`}
        >
          <div className="drawer caseView">
            <div className="drawerHead">
              <button onClick={() => setSelected(null)}>×</button>
              <p className="eyebrow">CASE #{String(selected.id).slice(-4)}</p>
              <h2>{selected.contactName}</h2>
              <p>
                {selected.organization || selected.caseType} ·{" "}
                {selected.country || selected.source}
              </p>
            </div>
            <div className="drawerBody">
              <div className="contactEditor">
                <label>
                  Contact name*
                  <input
                    required
                    value={selected.contactName}
                    onChange={(e) =>
                      setSelected({ ...selected, contactName: e.target.value })
                    }
                  />
                </label>
                <label>
                  Organisation
                  <input
                    value={selected.organization}
                    onChange={(e) =>
                      setSelected({ ...selected, organization: e.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={selected.email}
                    onChange={(e) =>
                      setSelected({ ...selected, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={selected.phone}
                    onChange={(e) =>
                      setSelected({ ...selected, phone: e.target.value })
                    }
                  />
                </label>
                <label>
                  Country
                  <input
                    value={selected.country}
                    onChange={(e) =>
                      setSelected({ ...selected, country: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="detailPair stageCard">
                <div className="stageCardHead">
                  <div>
                    <span>CURRENT PIPELINE STAGE</span>
                    <strong>{selected.stage}</strong>
                  </div>
                  <small>Important lead progress</small>
                </div>
                <div className="stageControls">
                  <select
                    aria-label="Pipeline stage"
                    value={selected.stage}
                    onChange={(e) =>
                      setSelected({ ...selected, stage: e.target.value })
                    }
                  >
                    {(
                      stageMap[selected.caseType] ??
                      stageMap["Student / parent enquiry"]
                    ).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <button type="button" onClick={updateStage}>
                    Update stage
                  </button>
                </div>
              </div>
              <div className="tagPicker">
                <label>Colour tags</label>
                <div>
                  {tagOptions.map((t) => (
                    <button
                      type="button"
                      key={t.key}
                      className={`tagChoice tag-${t.colour} ${readTags(selected.tags).includes(t.key) ? "selected" : ""}`}
                      onClick={() => toggleTag(t.key)}
                    >
                      <i></i>
                      {t.label}
                    </button>
                  ))}
                </div>
                <small>
                  See the legend on the main desk for what each colour means.
                </small>
              </div>
              <div className="nextBox">
                <span>NEXT ACTION</span>
                <input
                  value={selected.nextAction}
                  onChange={(e) =>
                    setSelected({ ...selected, nextAction: e.target.value })
                  }
                />
                <input
                  type="date"
                  value={selected.followUpDate}
                  onChange={(e) =>
                    setSelected({ ...selected, followUpDate: e.target.value })
                  }
                />
                <button onClick={() => startCompletion(selected)}>
                  ✓ Complete this action
                </button>
              </div>
              <form className="activityForm" onSubmit={addActivity}>
                <label>Record a contact action</label>
                <div>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                  >
                    {actionTypes.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <input
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="What happened?"
                  />
                  <button>＋ Add</button>
                </div>
              </form>
              <div className="timeline">
                <label>Contact history</label>
                {activitiesList.length ? (
                  activitiesList.map((a) => (
                    <article key={a.id}>
                      <i></i>
                      <div>
                        <b>{a.kind}</b>
                        <time>
                          {new Date(a.createdAt).toLocaleString("en-SG", {
                            timeZone: "Asia/Singapore",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                        <p>{a.note}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="noActivity">No recorded actions yet.</p>
                )}
              </div>
              <div className="detail editDetail">
                <label>Conversation summary</label>
                <textarea
                  value={selected.summary}
                  onChange={(e) =>
                    setSelected({ ...selected, summary: e.target.value })
                  }
                  placeholder="Paste the incoming email or key conversation details…"
                />
              </div>
              <div className="detail metadataCard">
                <span className="metadataTitle">LEAD CLASSIFICATION</span>
                {selected.caseType === "Student / parent enquiry" && (
                  <div
                    className={`applicationStatusRow ${selected.applicationOpened ? "opened" : "notOpened"}`}
                  >
                    <div>
                      <span>APPLICATION</span>
                      <strong>
                        {selected.applicationOpened
                          ? "Application opened"
                          : "Application not opened"}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateApplicationOpened(!selected.applicationOpened)
                      }
                    >
                      {selected.applicationOpened
                        ? "Mark as not opened"
                        : "Mark as opened"}
                    </button>
                  </div>
                )}
                <div className="metadataGrid">
                  <label>
                    Case type
                    <select
                      value={selected.caseType}
                      onChange={(e) => {
                        const caseType = e.target.value;
                        setSelected({
                          ...selected,
                          caseType,
                          stage: stageMap[caseType][0],
                        });
                      }}
                    >
                      {caseTypes.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Source
                    <select
                      value={sourceType(selected.source)}
                      onChange={(e) => {
                        const source = e.target.value;
                        setSelected({
                          ...selected,
                          source:
                            source === "Agent"
                              ? AGENT_PREFIX
                              : `${WALK_IN_PREFIX}${walkInMethods[0]}`,
                        });
                      }}
                    >
                      {sources.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  {sourceType(selected.source) === "Walk In" && (
                    <label>
                      Walk In method
                      <select
                        value={walkInMethodFromSource(selected.source)}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            source: `${WALK_IN_PREFIX}${e.target.value}`,
                          })
                        }
                      >
                        {walkInMethods.map((method) => (
                          <option key={method}>{method}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {sourceType(selected.source) === "Agent" && (
                    <label>
                      Agent name
                      <input
                        required
                        list="edit-agent-names"
                        value={agentFromSource(selected.source)}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            source: `${AGENT_PREFIX}${e.target.value}`,
                          })
                        }
                        placeholder="Type or select an agent"
                      />
                      <datalist id="edit-agent-names">
                        {agentNames.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className="drawerFoot">
              <button className="danger" onClick={deleteCase}>
                Delete case
              </button>
              <span className="drawerActions">
                <button className="secondary" onClick={saveCase}>
                  Save changes
                </button>
                <button
                  className="success"
                  onClick={() => startCompletion(selected, "converted")}
                >
                  ✓ Mark converted
                </button>
              </span>
            </div>
          </div>
        </div>
      )}
      {completing && (
        <div className="overlay completionOverlay">
          <form className="completionModal" onSubmit={completeFollowUp}>
            <div className="modalHead">
              <div>
                <p className="eyebrow">COMPLETE FOLLOW-UP</p>
                <h2>{completing.contactName}</h2>
                <p>
                  “{completing.nextAction || "Follow-up action"}” will be
                  recorded in the contact history.
                </p>
              </div>
              <button type="button" onClick={() => setCompleting(null)}>
                ×
              </button>
            </div>
            <div className="completionBody">
              <p className="completionQuestion">What happens next?</p>
              <div className="completionChoices">
                <label>
                  <input
                    type="radio"
                    name="completionChoice"
                    checked={completionChoice === "followup"}
                    onChange={() => setCompletionChoice("followup")}
                  />
                  Set next follow-up
                </label>
                <label>
                  <input
                    type="radio"
                    name="completionChoice"
                    checked={completionChoice === "converted"}
                    onChange={() => setCompletionChoice("converted")}
                  />
                  Mark converted
                </label>
                <label>
                  <input
                    type="radio"
                    name="completionChoice"
                    checked={completionChoice === "closed"}
                    onChange={() => setCompletionChoice("closed")}
                  />
                  Close lead
                </label>
              </div>
              {completionChoice === "followup" && (
                <div className="completionFields">
                  <label>
                    Next action*
                    <input
                      required
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                      placeholder="What must happen next?"
                    />
                  </label>
                  <label>
                    Follow-up date*
                    <input
                      required
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                    />
                  </label>
                </div>
              )}
              {completionChoice === "converted" && (
                <div className="completionMessage successMessage">
                  This lead will move to Converted and leave the active to-do
                  list.
                </div>
              )}
              {completionChoice === "closed" && (
                <label className="closeReason">
                  Reason for closing
                  <select
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value)}
                  >
                    <option>No response</option>
                    <option>Chose another school</option>
                    <option>Not eligible</option>
                    <option>Timing changed</option>
                    <option>Duplicate</option>
                    <option>Other</option>
                  </select>
                </label>
              )}
            </div>
            <div className="modalFoot">
              <button
                type="button"
                className="secondary"
                onClick={() => setCompleting(null)}
              >
                Cancel
              </button>
              <button className="primary">
                {completionChoice === "followup"
                  ? "Save next follow-up"
                  : completionChoice === "converted"
                    ? "Complete and convert"
                    : "Complete and close"}
              </button>
            </div>
          </form>
        </div>
      )}
      {notice && <div className="toast">✓ {notice}</div>}
    </div>
  );
}
