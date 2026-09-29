// Celebrations for announced tasks (HLR-11): a share prompt, and a bigger one for milestones.
import { useEffect } from "react";

/** " 🔥 3-day streak", or "" when there's no streak worth mentioning. */
export function streakText(task) {
  if (!task.currentStreak || task.currentStreak < 2 || task.frequency === "one_off") return "";
  return ` 🔥 ${task.currentStreak}-${task.frequency === "daily" ? "day" : "week"} streak`;
}

/** A WhatsApp link with the text prefilled; the user picks who to send it to. */
export function whatsappShare(task, prefix = "Done") {
  return `https://wa.me/?text=${encodeURIComponent(`${prefix}: ${task.title}${streakText(task)}`)}`;
}

/** The milestone celebration: larger and longer than a toast, dismissed by the user. Respects reduced motion (CSS). */
export function MilestoneCelebration({ task, rewards = [], onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="rw-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rw-card rw-dialog rw-milestone" role="alertdialog" aria-modal="true" aria-labelledby="rw-milestone-title">
        <div className="rw-milestone-burst" aria-hidden="true">
          🏁 🎉 ✨
        </div>
        <h3 id="rw-milestone-title">Milestone reached!</h3>
        <p className="rw-milestone-task">{task.title}</p>
        {rewards.length > 0 && (
          <p>
            Unlocked: <strong>{rewards.map((r) => r.title).join(", ")}</strong> 🎁
          </p>
        )}
        <div className="rw-inline-form">
          <a className="rw-btn rw-btn--primary" href={whatsappShare(task, "Milestone reached")} target="_blank" rel="noreferrer">
            Share on WhatsApp
          </a>
          <button type="button" className="rw-btn" onClick={onClose} autoFocus>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
