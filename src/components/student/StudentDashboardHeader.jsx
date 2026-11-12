import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, GraduationCap, LogOut, UserRound } from "lucide-react";
import { NOTIFICATIONS_EVENT } from "../../utils/demoNotifications";
import "./StudentDashboardTheme.css";

function readAccount(email) {
  const key = `educonnect.student.${email.trim().toLowerCase()}`;
  try {
    const profile = JSON.parse(localStorage.getItem(`${key}.profile`) || "{}") || {};
    const notifications = JSON.parse(localStorage.getItem(`${key}.notifications`) || "[]");
    return { profile, unread: Array.isArray(notifications) ? notifications.filter(item => !item.read).length : 0 };
  } catch { return { profile: {}, unread: 0 }; }
}

export default function StudentDashboardHeader({ email, onLogout }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState(() => readAccount(email));
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef(null);
  useEffect(() => {
    const refresh = () => setAccount(readAccount(email));
    const close = event => { if (!menu.current?.contains(event.target)) setMenuOpen(false); };
    const escape = event => { if (event.key === "Escape") setMenuOpen(false); };
    const events = ["storage", "focus", "educonnect:student-header-changed", NOTIFICATIONS_EVENT];
    events.forEach(event => window.addEventListener(event, refresh));
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      events.forEach(event => window.removeEventListener(event, refresh));
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [email]);
  const name = account.profile.fullName?.trim() || "Student";
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("");
  const openTab = tab => { setMenuOpen(false); navigate("/student/dashboard", { state: { studentTab: tab } }); };

  return <header className="auth-topbar edc-student-topbar">
    <Link className="auth-brand edc-student-brand" to="/" aria-label="EduConnect AI home"><GraduationCap size={32} strokeWidth={2.2}/><span>EduConnect <b>AI</b></span></Link>
    <div className="edc-student-topbar-actions">
      <button type="button" className="edc-topbar-bell" aria-label={`Notifications, ${account.unread} unread`} onClick={() => openTab("notifications")}><Bell size={21}/>{account.unread > 0 && <span/>}</button>
      <div className="edc-topbar-account" ref={menu}>
        <button type="button" className="edc-topbar-profile" aria-expanded={menuOpen} aria-label="Open student account menu" onClick={() => setMenuOpen(!menuOpen)}><span className="edc-topbar-avatar">{account.profile.avatar ? <img src={account.profile.avatar} alt=""/> : initials}</span><span className="edc-topbar-identity"><strong>{name}</strong><small>Student</small></span><ChevronDown size={16}/></button>
        {menuOpen && <div className="edc-topbar-account-menu"><button type="button" onClick={() => openTab("profile")}><UserRound size={16}/> My Profile</button><button type="button" onClick={onLogout}><LogOut size={16}/> Log Out</button></div>}
      </div>
    </div>
  </header>;
}
