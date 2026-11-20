import { ShieldCheck } from "lucide-react";
import "./PaymentProviderPicker.css";

const PROVIDERS = [
  { name: "jazzcash", label: "JazzCash", hint: "Pay with your JazzCash mobile account" },
  { name: "easypaisa", label: "Easypaisa", hint: "Pay with your Easypaisa account" },
  { name: "safepay", label: "Safepay", hint: "Card or bank via Safepay secure checkout" },
];

// Shared provider selection used by the cart and checkout panels.
// Purple theme preserved; never asks for card details — hands off to the provider.
export default function PaymentProviderPicker({ providers = [], mode = "sandbox", selected, onSelect, disabled = false }) {
  const byName = new Map(providers.map((entry) => [entry.name, entry]));
  const anyEnabled = providers.some((entry) => entry.enabled);
  return (
    <div className="edc-providers" aria-label="Payment method">
      <p className="edc-providers-title">
        <ShieldCheck size={15} /> Secure Payment
        <span className="edc-providers-mode">{mode === "live" ? "Live" : "Sandbox"}</span>
      </p>
      <div className="edc-providers-list" role="radiogroup" aria-label="Choose a payment provider">
        {PROVIDERS.map(({ name, label, hint }) => {
          const info = byName.get(name);
          const enabled = Boolean(info?.enabled);
          const status = info?.status || "unconfigured";
          const chosen = selected === name;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={disabled || !enabled}
              className={`edc-provider-option${chosen ? " selected" : ""}`}
              onClick={() => onSelect(name)}
              title={enabled ? hint : "This provider is not configured yet."}
            >
              <span className={`edc-provider-badge ${name}`} aria-hidden="true">
                {name === "jazzcash" ? "JC" : name === "easypaisa" ? "EP" : "SP"}
              </span>
              <span className="edc-provider-text">
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
              <span className={`edc-provider-status ${status}`}>
                {status === "sandbox-ready" ? "Sandbox ready" : status === "live" ? "Live" : "Unconfigured"}
              </span>
            </button>
          );
        })}
      </div>
      {!anyEnabled && (
        <p className="edc-providers-error" role="status">No payment provider is configured on the server, so paid checkout is unavailable. Free items can still be checked out. An admin must set sandbox merchant credentials in the backend environment to enable JazzCash, Easypaisa or Safepay (see .env.example).</p>
      )}
      <p className="edc-providers-note">Payments are processed on the provider's secure page. EduConnect AI never sees or stores your card, wallet PIN or OTP.</p>
    </div>
  );
}
