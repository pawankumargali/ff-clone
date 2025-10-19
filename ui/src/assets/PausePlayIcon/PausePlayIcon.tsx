export default function PausePlayIcon({ paused }: { paused: boolean }) {
  return paused ? (
    // PLAY
    <svg viewBox="0 0 24 24" className="cta-icon" aria-hidden="true">
      <path d="M8 7v10l9-5-9-5z" fill="currentColor" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) : (
    // PAUSE
    <svg viewBox="0 0 24 24" className="cta-icon" aria-hidden="true">
      <rect x="7" y="7" width="3" height="10" fill="currentColor" />
      <rect x="14" y="7" width="3" height="10" fill="currentColor" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}