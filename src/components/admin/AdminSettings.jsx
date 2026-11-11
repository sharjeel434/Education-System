import { useState } from "react";
import { Check, RotateCcw, Settings2 } from "lucide-react";
import { appendAdminActivityRecord } from "./adminData";
import {
  DEFAULT_ADMIN_PREFERENCES,
  saveAdminPreferences,
  resetAdminPreferences,
} from "./adminSettings";
import {
  DEFAULT_ADMIN_PLATFORM_SETTINGS,
  getAdminPlatformSettings,
  saveAdminPlatformSettings,
  resetAdminPlatformSettings,
} from "./adminPlatformSettings";

function AdminSettings({ preferences, platformSettings }) {
  const [density, setDensity] = useState(preferences.density);
  const [draft, setDraft] = useState(platformSettings || getAdminPlatformSettings());
  const [feedback, setFeedback] = useState(null);

  function update(group, key, value) {
    setDraft((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value },
    }));
  }

  function recordSettingsChange(action, description, previousValue, newValue, options = {}) {
    try {
      const actor = window.sessionStorage.getItem("educonnect.demoEmail") || "Admin";
      appendAdminActivityRecord({
        actor,
        actorRole: "Admin",
        action,
        category: options.category || "admin-settings",
        module: options.module || "Settings & Configuration",
        entityType: options.entityType || "Admin Settings",
        entityId: options.entityId || "platform-settings",
        targetId: options.entityId || "platform-settings",
        targetName: options.targetName || "Admin platform configuration",
        previousValue,
        newValue,
        description,
        result: "Success",
      });
    } catch {
      // A local audit storage error must not roll back saved settings.
    }
  }

  function handleSave(event) {
    event.preventDefault();
    try {
      const changedFields = [];
      ["general", "appearance", "rules", "marketplace", "system", "notifications"].forEach((group) => {
        Object.keys(draft[group] || {}).forEach((key) => {
          if (JSON.stringify(draft[group][key]) !== JSON.stringify(platformSettings?.[group]?.[key])) {
            changedFields.push(`${group}.${key}`);
          }
        });
      });
      if (density !== preferences.density) changedFields.push("appearance.contentSpacing");
      saveAdminPlatformSettings(draft);
      saveAdminPreferences({ density });
      recordSettingsChange(
        "Admin Settings Updated",
        "Admin saved platform settings. Values such as support email, URLs, and credentials are not copied into the activity record.",
        changedFields.length ? `Changed fields: ${changedFields.join(", ")}` : "Current saved configuration",
        "Updated configuration",
      );
      const changedRuleFields = changedFields.filter((field) => field.startsWith("rules."));
      if (changedRuleFields.length) {
        recordSettingsChange(
          "Security Policy Updated",
          "Admin updated review or publishing policy settings. Policy values are not copied into the security activity record.",
          `Changed policy fields: ${changedRuleFields.join(", ")}`,
          "Updated policy",
          { category: "security", module: "Security & Access", entityType: "Security Policy", entityId: "platform-rules", targetName: "Platform review and publishing policy" },
        );
      }
      setFeedback({ type: "success", message: "Settings saved in this browser." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Settings could not be saved." });
    }
  }

  function handleReset() {
    if (!window.confirm("Reset all Admin settings to their defaults?")) return;
    try {
      resetAdminPlatformSettings();
      resetAdminPreferences();
      recordSettingsChange(
        "Admin Settings Reset",
        "Admin reset platform and interface settings to their defaults. Sensitive setting values are not copied into the activity record.",
        "Current saved settings",
        "Default settings",
      );
      if (JSON.stringify(platformSettings?.rules) !== JSON.stringify(DEFAULT_ADMIN_PLATFORM_SETTINGS.rules)) {
        recordSettingsChange(
          "Security Policy Reset",
          "Admin reset review and publishing policies to their defaults. Policy values are not copied into the security activity record.",
          "Current saved policy",
          "Default policy",
          { category: "security", module: "Security & Access", entityType: "Security Policy", entityId: "platform-rules", targetName: "Platform review and publishing policy" },
        );
      }
      setDensity(DEFAULT_ADMIN_PREFERENCES.density);
      setDraft({ ...DEFAULT_ADMIN_PLATFORM_SETTINGS });
      setFeedback({ type: "success", message: "All Admin settings were reset to their defaults." });
    } catch {
      setFeedback({ type: "error", message: "Settings could not be reset." });
    }
  }

  const { general, appearance, rules, marketplace, system, notifications } = draft;

  return (
    <form className="edc-admin-settings edc-admin-settings-grid" onSubmit={handleSave}>
      <section className="edc-admin-panel edc-admin-settings-panel">
        <SettingsHeading title="General Settings" description="Set the platform identity, language, and support details." />
        <div className="edc-admin-settings-fields">
          <Field label="Website Name"><input value={general.websiteName} onChange={(event) => update("general", "websiteName", event.target.value)} required /></Field>
          <Field label="Tagline"><input value={general.tagline} onChange={(event) => update("general", "tagline", event.target.value)} /></Field>
          <Field label="Website Logo URL"><input type="url" placeholder="https://…" value={general.logoUrl} onChange={(event) => update("general", "logoUrl", event.target.value)} /></Field>
          <Field label="Favicon URL"><input type="url" placeholder="https://…" value={general.faviconUrl} onChange={(event) => update("general", "faviconUrl", event.target.value)} /></Field>
          <Field label="Support Email"><input type="email" value={general.supportEmail} onChange={(event) => update("general", "supportEmail", event.target.value)} required /></Field>
          <Field label="Default Language"><select value={general.language} onChange={(event) => update("general", "language", event.target.value)}><option>English</option><option>Urdu</option></select></Field>
          <Field label="Timezone"><select value={general.timezone} onChange={(event) => update("general", "timezone", event.target.value)}><option value="Asia/Karachi">Asia/Karachi (PKT)</option><option value="UTC">UTC</option><option value="Asia/Dubai">Asia/Dubai</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></Field>
        </div>
      </section>

      <section className="edc-admin-panel edc-admin-settings-panel">
        <SettingsHeading title="Appearance Settings" description="Choose how the Admin workspace is displayed." />
        <fieldset className="edc-admin-settings-options">
          <legend>Content spacing</legend>
          <Choice title="Comfortable" description="Standard spacing and card sizes." checked={density === "comfortable"} onChange={() => setDensity("comfortable")} name="admin-density" value="comfortable" />
          <Choice title="Compact" description="Fit more Admin content on screen." checked={density === "compact"} onChange={() => setDensity("compact")} name="admin-density" value="compact" />
        </fieldset>
        <div className="edc-admin-settings-fields">
          <Field label="Theme"><select value={appearance.theme} onChange={(event) => update("appearance", "theme", event.target.value)}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></Field>
          <Field label="Sidebar display"><select value={appearance.sidebar} onChange={(event) => update("appearance", "sidebar", event.target.value)}><option value="expanded">Expanded</option><option value="compact">Compact</option></select></Field>
        </div>
      </section>

      <section className="edc-admin-panel edc-admin-settings-panel">
        <SettingsHeading title="Platform Rules" description="Configure review and publishing requirements. Approval actions remain in their existing admin sections." />
        <div className="edc-admin-settings-toggles">
          <Toggle title="Teacher Verification Required" checked={rules.teacherVerificationRequired} onChange={(value) => update("rules", "teacherVerificationRequired", value)} />
          <Toggle title="Course Approval Required" checked={rules.courseApprovalRequired} onChange={(value) => update("rules", "courseApprovalRequired", value)} />
          <Toggle title="PDF/eBook Approval Required" checked={rules.ebookApprovalRequired} onChange={(value) => update("rules", "ebookApprovalRequired", value)} />
        </div>
        <div className="edc-admin-settings-fields">
          <Field label="Content Publishing Rules"><select value={rules.contentPublishingRules} onChange={(event) => update("rules", "contentPublishingRules", event.target.value)}><option>Approved content only</option><option>Admin review required</option><option>Allow teacher publishing</option></select></Field>
        </div>
      </section>

      <section className="edc-admin-panel edc-admin-settings-panel">
        <SettingsHeading title="Notification Preferences" description="Choose which platform events should appear as Admin alerts." />
        <div className="edc-admin-settings-toggles">
          <Toggle title="New Teacher Application Alerts" checked={notifications.newTeacherApplicationAlerts} onChange={(value) => update("notifications", "newTeacherApplicationAlerts", value)} />
          <Toggle title="Course Approval Alerts" checked={notifications.courseApprovalAlerts} onChange={(value) => update("notifications", "courseApprovalAlerts", value)} />
          <Toggle title="PDF Approval Alerts" checked={notifications.pdfApprovalAlerts} onChange={(value) => update("notifications", "pdfApprovalAlerts", value)} />
          <Toggle title="Student Help Request Alerts" checked={notifications.studentHelpRequestAlerts} onChange={(value) => update("notifications", "studentHelpRequestAlerts", value)} />
          <Toggle title="System Announcements" checked={notifications.systemAnnouncements} onChange={(value) => update("notifications", "systemAnnouncements", value)} />
        </div>
        <p className="edc-admin-settings-note">Preferences are saved locally. Teacher application, course review, and support ticket/appeal alerts use existing saved records; PDF and system announcement sources depend on their workflows.</p>
      </section>

      <section className="edc-admin-panel edc-admin-settings-panel">
        <SettingsHeading title="Marketplace Configuration" description="Set demo marketplace defaults and checkout behavior." />
        <div className="edc-admin-settings-fields">
          <Field label="Default Currency"><select value={marketplace.currency} onChange={(event) => update("marketplace", "currency", event.target.value)}><option value="PKR">PKR — Pakistani Rupee</option><option value="USD">USD — US Dollar</option><option value="GBP">GBP — British Pound</option><option value="AED">AED — UAE Dirham</option></select></Field>
          <Field label="Platform Commission (%)"><input type="number" min="0" max="50" step="0.1" value={marketplace.commissionRate} onChange={(event) => update("marketplace", "commissionRate", event.target.value)} /></Field>
        </div>
        <div className="edc-admin-settings-toggles">
          <Toggle title="Free Content Allowed" checked={marketplace.allowFreeContent} onChange={(value) => update("marketplace", "allowFreeContent", value)} />
          <Toggle title="Paid Content Allowed" checked={marketplace.allowPaidContent} onChange={(value) => update("marketplace", "allowPaidContent", value)} />
          <Toggle title="Demo Checkout Mode" checked={marketplace.demoCheckoutMode} onChange={(value) => update("marketplace", "demoCheckoutMode", value)} />
        </div>
      </section>

      <section className="edc-admin-panel edc-admin-settings-panel">
        <SettingsHeading title="System Configuration" description="Configure maintenance, account creation, uploads, and PDF size limits." />
        <div className="edc-admin-settings-toggles">
          <Toggle title="Maintenance Mode" checked={system.maintenanceMode} onChange={(value) => update("system", "maintenanceMode", value)} />
          <Toggle title="Registration Enabled" checked={system.registrationEnabled} onChange={(value) => update("system", "registrationEnabled", value)} />
          <Toggle title="Course Upload Enabled" checked={system.courseUploadEnabled} onChange={(value) => update("system", "courseUploadEnabled", value)} />
        </div>
        <div className="edc-admin-settings-fields">
          <Field label="PDF Upload Size Limit (MB)"><input type="number" min="1" max="500" step="1" value={system.pdfUploadLimitMb} onChange={(event) => update("system", "pdfUploadLimitMb", event.target.value)} /></Field>
        </div>
      </section>

      <div className="edc-admin-settings-actions edc-admin-settings-global-actions">
        <button className="edc-admin-settings-save" type="submit"><Check size={16} aria-hidden="true" /> Save Changes / Configuration</button>
        <button className="edc-admin-settings-reset" type="button" onClick={handleReset}><RotateCcw size={15} aria-hidden="true" /> Reset to Default</button>
      </div>
      {preferences.error && <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{preferences.error}</p>}
      {platformSettings?.error && <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">{platformSettings.error}</p>}
      {feedback && <p className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.message}</p>}
      <p className="edc-admin-settings-note">Settings are saved to this browser in the frontend demo. Platform rules and system switches are configuration values and do not enforce server-side behavior.</p>
    </form>
  );
}

function SettingsHeading({ title, description }) {
  return <div className="edc-admin-settings-heading"><span className="edc-admin-settings-icon" aria-hidden="true"><Settings2 size={19} /></span><div><h3>{title}</h3><p>{description}</p></div></div>;
}

function Field({ label, children }) {
  return <label className="edc-admin-settings-field"><span>{label}</span>{children}</label>;
}

function Choice({ title, description, ...inputProps }) {
  return <label className="edc-admin-settings-option"><input type="radio" {...inputProps} /><span><strong>{title}</strong><small>{description}</small></span></label>;
}

function Toggle({ title, checked, onChange }) {
  return <label className="edc-admin-settings-toggle"><span>{title}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

export default AdminSettings;
