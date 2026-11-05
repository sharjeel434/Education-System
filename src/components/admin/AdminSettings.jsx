import { useState } from "react";
import { Check, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  ADMIN_DENSITY_OPTIONS,
  DEFAULT_ADMIN_PREFERENCES,
  saveAdminPreferences,
  resetAdminPreferences,
} from "./adminSettings";

function AdminSettings({ preferences }) {
  const [density, setDensity] = useState(preferences.density);
  const [feedback, setFeedback] = useState(null);

  function handleSave() {
    try {
      if (!ADMIN_DENSITY_OPTIONS.includes(density)) {
        throw new Error("Choose a supported Admin interface density.");
      }

      saveAdminPreferences({ density });
      setFeedback({
        type: "success",
        message: "Admin interface preference saved in this browser.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Admin interface preference could not be saved.",
      });
    }
  }

  function handleReset() {
    if (!window.confirm("Reset the saved Admin interface preference to comfortable spacing?")) {
      return;
    }

    try {
      resetAdminPreferences();
      setDensity(DEFAULT_ADMIN_PREFERENCES.density);
      setFeedback({
        type: "success",
        message: "Admin interface preference reset to comfortable spacing.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Admin interface preference could not be reset.",
      });
    }
  }

  const isDirty = density !== preferences.density || Boolean(preferences.error);

  return (
    <section className="edc-admin-settings">
      <article className="edc-admin-panel edc-admin-settings-panel">
        <div className="edc-admin-settings-heading">
          <span className="edc-admin-settings-icon" aria-hidden="true">
            <SlidersHorizontal size={19} />
          </span>
          <div>
            <h3>Interface display</h3>
            <p>These preferences affect only the Admin interface in this browser.</p>
          </div>
        </div>

        {preferences.error && (
          <p className="edc-admin-feedback edc-admin-feedback-error" role="alert">
            {preferences.error} The default comfortable spacing is active. Saving a preference will replace the invalid value.
          </p>
        )}

        <fieldset className="edc-admin-settings-options">
          <legend>Content spacing</legend>
          <label className="edc-admin-settings-option">
            <input
              type="radio"
              name="admin-density"
              value="comfortable"
              checked={density === "comfortable"}
              onChange={() => setDensity("comfortable")}
            />
            <span>
              <strong>Comfortable</strong>
              <small>Use the standard spacing and card sizes.</small>
            </span>
          </label>
          <label className="edc-admin-settings-option">
            <input
              type="radio"
              name="admin-density"
              value="compact"
              checked={density === "compact"}
              onChange={() => setDensity("compact")}
            />
            <span>
              <strong>Compact</strong>
              <small>Reduce spacing to fit more Admin content on screen.</small>
            </span>
          </label>
        </fieldset>

        <div className="edc-admin-settings-actions">
          <button
            className="edc-admin-settings-save"
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
          >
            <Check size={16} aria-hidden="true" />
            Save preference
          </button>
          <button
            className="edc-admin-settings-reset"
            type="button"
            onClick={handleReset}
            disabled={!preferences.error && density === DEFAULT_ADMIN_PREFERENCES.density}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reset to default
          </button>
        </div>

        {feedback && (
          <p
            className={`edc-admin-feedback edc-admin-feedback-${feedback.type}`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}

        <p className="edc-admin-settings-note">
          This is a local interface preference only. It does not change server-side behavior or platform configuration.
        </p>
      </article>
    </section>
  );
}

export default AdminSettings;
