import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import {
  ADMIN_DATA_CHANGED_EVENT,
  getAdminKnowledgeStorageState,
} from "./adminData";
import {
  AI_DEMO_RECORDS,
  readAdminOperationsSettings,
  updateAiFeatureFlag,
  updateAiIncidentStatus,
} from "./adminOperationsData";
import "./AdminOperations.css";

const SECTIONS = [
  ["models", "Models & prompts"],
  ["usage", "Usage & cost"],
  ["incidents", "Safety incidents"],
  ["evaluations", "Evaluations"],
  ["flags", "Feature flags"],
  ["knowledge", "Knowledge status"],
];

function AdminAIOperations({ email }) {
  const [settings, setSettings] = useState(readAdminOperationsSettings);
  const [knowledgeState, setKnowledgeState] = useState(getAdminKnowledgeStorageState);
  const [section, setSection] = useState("models");
  const [selectedModel, setSelectedModel] = useState(null);
  const [feedback, setFeedback] = useState(null);

  function refresh() {
    setSettings(readAdminOperationsSettings());
    setKnowledgeState(getAdminKnowledgeStorageState());
  }

  useEffect(() => {
    window.addEventListener("storage", refresh);
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, refresh);
    };
  }, []);

  const knowledgeCounts = useMemo(() => {
    const proposals = knowledgeState.proposals;
    return {
      total: proposals.length,
      pending: proposals.filter((proposal) => proposal.status === "Pending Review").length,
      approved: proposals.filter((proposal) => proposal.status === "Approved for Processing").length,
    };
  }, [knowledgeState.proposals]);

  function toggleFlag(flag) {
    const enabled = !settings.aiFlags[flag.id];
    try {
      updateAiFeatureFlag(
        settings,
        flag.id,
        enabled,
        email || window.sessionStorage.getItem("educonnect.demoEmail") || "Admin",
      );
      refresh();
      setFeedback({ type: "success", text: `${flag.label} demo flag ${enabled ? "enabled" : "disabled"} locally.` });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Demo flag could not be updated." });
    }
  }

  function updateIncident(incident, status) {
    try {
      updateAiIncidentStatus(
        settings,
        incident.id,
        status,
        email || window.sessionStorage.getItem("educonnect.demoEmail") || "Admin",
      );
      refresh();
      setFeedback({ type: "success", text: `Demo incident review marked ${status}.` });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Demo incident status could not be saved." });
    }
  }

  const cards = [
    { id: "models", label: "Model configurations", value: AI_DEMO_RECORDS.models.length, icon: BrainCircuit },
    { id: "usage", label: "Sample usage metrics", value: AI_DEMO_RECORDS.metrics.length, icon: Gauge },
    { id: "incidents", label: "Sample safety incidents", value: AI_DEMO_RECORDS.incidents.length, icon: AlertTriangle },
    { id: "knowledge", label: "Existing knowledge proposals", value: knowledgeCounts.total, icon: CheckCircle2 },
  ];

  return (
    <section className="edc-admin-operations">
      <p className="edc-admin-security-note">
        AI Operations is a frontend demo console. Configuration examples, metrics, safety incidents and evaluation data below are illustrative and are not connected to an AI provider, model deployment or live monitoring. Knowledge proposals are existing local governance records and are not approved or published here.
      </p>
      {feedback && <p className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.text}</p>}
      {settings.error && <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{settings.error}</p>}
      {knowledgeState.error && <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{knowledgeState.error}</p>}

      <div className="edc-admin-stat-grid">
        {cards.map(({ id, label, value, icon: Icon }) => (
          <button type="button" className={`edc-admin-stat-card edc-admin-ops-card${section === id ? " edc-admin-ops-card-active" : ""}`} key={id} onClick={() => setSection(id)} aria-pressed={section === id}>
            <span className="edc-admin-stat-icon" aria-hidden="true"><Icon size={19} /></span><p>{label}</p><strong>{value}</strong>
          </button>
        ))}
        <button type="button" className="edc-admin-stat-card edc-admin-ops-card" onClick={() => setSection("knowledge")}>
          <span className="edc-admin-stat-icon" aria-hidden="true"><ShieldCheck size={19} /></span><p>Pending knowledge review</p><strong>{knowledgeCounts.pending}</strong>
        </button>
      </div>

      <div className="edc-admin-application-filters edc-admin-ops-tabs" aria-label="AI operations sections">
        {SECTIONS.map(([id, label]) => (
          <button type="button" className={`edc-admin-filter-button${section === id ? " edc-admin-filter-button-active" : ""}`} key={id} onClick={() => setSection(id)} aria-pressed={section === id}>{label}</button>
        ))}
      </div>

      {section === "models" && (
        <div className="edc-admin-ops-grid">
          {AI_DEMO_RECORDS.models.map((model) => (
            <button type="button" className="edc-admin-panel edc-admin-ops-card edc-admin-ops-model" key={model.id} onClick={() => setSelectedModel(model)}>
              <span className="edc-admin-page-eyebrow">DEMO CONFIGURATION</span><h3>{model.model}</h3>
              <p>{model.provider} · {model.version}</p><span>{model.status}</span><small>View configuration details</small>
            </button>
          ))}
          <article className="edc-admin-panel">
            <div className="edc-admin-panel-heading"><div><h3>Deployment boundary</h3><p>Configuration examples are separate from deployment approval and do not call a provider.</p></div></div>
            <p className="edc-admin-settings-note">No deployment controls or provider credentials are configured in this frontend demo.</p>
          </article>
        </div>
      )}

      {section === "usage" && (
        <div className="edc-admin-stat-grid">
          {AI_DEMO_RECORDS.metrics.map((metric) => (
            <article className="edc-admin-stat-card" key={metric.id}>
              <span className="edc-admin-stat-icon" aria-hidden="true"><Gauge size={19} /></span><p>{metric.label}</p><strong>{metric.value}</strong><small>{metric.note}</small>
            </article>
          ))}
        </div>
      )}

      {section === "incidents" && (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table">
            <thead><tr><th>Incident</th><th>Severity</th><th>Review status</th><th>Details</th></tr></thead>
            <tbody>{AI_DEMO_RECORDS.incidents.map((incident) => (
              <tr key={incident.id}>
                <td><strong>{incident.title}</strong><span>{incident.id}</span></td><td>{incident.severity}</td>
                <td>
                  <select
                    className="edc-admin-select"
                    aria-label={`Review status for ${incident.title}`}
                    value={settings.aiIncidentStatuses[incident.id] || incident.status}
                    onChange={(event) => updateIncident(incident, event.target.value)}
                  >
                    {["Open", "Under Review", "Reviewed"].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td>{incident.detail}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {section === "evaluations" && (
        <div className="edc-admin-table-wrap">
          <table className="edc-admin-applications-table">
            <thead><tr><th>Evaluation suite</th><th>Result</th><th>Threshold</th><th>Score</th></tr></thead>
            <tbody>{AI_DEMO_RECORDS.evaluations.map((evaluation) => (
              <tr key={evaluation.id}><td>{evaluation.suite}</td><td>{evaluation.result}</td><td>{evaluation.threshold}</td><td>{evaluation.score}</td></tr>
            ))}</tbody>
          </table>
          <p className="edc-admin-settings-note">Illustrative evaluation records only; no evaluation jobs are run.</p>
        </div>
      )}

      {section === "flags" && (
        <div className="edc-admin-ops-grid">
          {AI_DEMO_RECORDS.flags.map((flag) => (
            <article className="edc-admin-panel" key={flag.id}>
              <div className="edc-admin-panel-heading"><div><h3>{flag.label}</h3><p>Browser-local demo flag; does not enable a live AI feature.</p></div></div>
              <label className="edc-admin-ops-toggle">
                <input type="checkbox" checked={Boolean(settings.aiFlags[flag.id])} onChange={() => toggleFlag(flag)} />
                <span>{settings.aiFlags[flag.id] ? "Enabled for demo UI" : "Disabled for demo UI"}</span>
              </label>
            </article>
          ))}
        </div>
      )}

      {section === "knowledge" && (
        <>
          <p className="edc-admin-settings-note">Knowledge Governance remains the source of proposal decisions. This view is read-only and does not approve, process or publish proposals.</p>
          {knowledgeState.proposals.length ? (
            <div className="edc-admin-table-wrap">
              <table className="edc-admin-applications-table">
                <thead><tr><th>Proposal</th><th>Course</th><th>Teacher</th><th>Status</th></tr></thead>
                <tbody>{knowledgeState.proposals.map((proposal, index) => (
                  <tr key={proposal.proposalId || `proposal-${index}`}><td>{proposal.proposedTopic || "Untitled proposal"}</td><td>{proposal.courseSnapshot?.title || "Not linked"}</td><td>{proposal.teacherName || proposal.teacherEmail || "Not provided"}</td><td>{proposal.status || "Unknown"}</td></tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="edc-admin-applications-empty"><h3>No knowledge proposals available</h3><p>Proposal records are managed in Knowledge Governance.</p></div>}
        </>
      )}

      {selectedModel && (
        <div className="edc-admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedModel(null)}>
          <section className="edc-admin-details-modal" role="dialog" aria-modal="true" aria-labelledby="admin-ai-model-detail">
            <header className="edc-admin-details-header"><div><span className="edc-admin-page-eyebrow">DEMO MODEL CONFIGURATION</span><h3 id="admin-ai-model-detail">{selectedModel.model}</h3></div><button type="button" className="edc-admin-modal-close" onClick={() => setSelectedModel(null)} aria-label="Close details">×</button></header>
            <dl className="edc-admin-details-list">{Object.entries(selectedModel).map(([key, value]) => <div className="edc-admin-detail-field" key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
            <p className="edc-admin-settings-note">Prompt/model details are examples only. No provider credentials or deployment changes are supported.</p>
          </section>
        </div>
      )}
    </section>
  );
}

export default AdminAIOperations;
