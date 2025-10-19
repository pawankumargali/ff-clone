import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../../components/Navbar/Navbar";
import "./RecordMeeting.css";
import MicIcon from "../../assets/MicIcon/MicIcon";
import RecordIcon from "../../assets/RecordIcon/RecordIcon";
import PausePlayIcon from "../../assets/PausePlayIcon/PausePlayIcon";
import StopIcon from "../../assets/StopIcon/StopIcon";

export default function RecordMeeting() {
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);        // seconds
  const [started, setStarted] = useState(false);    // start hides the Start button
  const [running, setRunning] = useState(false);    // true = ticking, false = paused
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const time = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

  const onStart = () => {
    setStarted(true);
    setRunning(true);
  };

  const onPauseResume = () => setRunning((v) => !v);

  const onStop = () => {
    setRunning(false);
    setShowModal(true);
    setElapsed(0);
    setStarted(false);
  };

  return (
    <main>
        <div style={{padding: '24px'}}>
            <Navbar showBackBtn={true} />
        </div>
    
    <div className="rec-root">
      <header className="rec-header">
        <div className="left">
          <div className="titles">
            <h1 className="title">Record Meeting</h1>
            <p className="subtitle">Simulated recorder (no audio captured)</p>
          </div>
        </div>
      </header>

      <section className="dash-card rec-card" aria-labelledby="rec-title">
        {/* Title input */}
        <label htmlFor="meeting-title" className="label">Meeting Title</label>
        <input
          id="meeting-title"
          className="input"
          type="text"
          placeholder="e.g., Customer Call — ACME Corp"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Mic + Timer */}
        <div className="rec-panel">
          <div className={`mic ${running ? "mic-on" : ""}`} aria-hidden="true">
            <MicIcon />
          </div>
          <div className="timer" aria-live="polite" aria-atomic="true">{time}</div>
        </div>

        {/* Controls */}
        <div className="controls">
          {!started ? (
            <button className="cta-btn" onClick={onStart} aria-label="Start Recording">
              <RecordIcon />
              <span>Start Recording</span>
            </button>
          ) : (
            <>
              <button className="cta-btn" onClick={onPauseResume} aria-label={running ? "Pause" : "Resume"}>
                <PausePlayIcon paused={!running} />
                <span>{running ? "Pause" : "Resume"}</span>
              </button>
              <button className="danger-btn" onClick={onStop} aria-label="Stop Recording">
                <StopIcon />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>

        {/* Disclaimers */}
        <div className="note">
          <div>
            <p className="note-line"><strong>Note:</strong> No audio is actually being recorded.</p>
            <p className="note-line"><strong>Simulation only:</strong> No audio is actually being recorded.</p>
            <p className="note-line"><strong>Language:</strong> English is the only supported language.</p>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="rec-success">
          <div className="modal">
            <h3 id="rec-success">Recording Successful</h3>
            <p>Recording simulation has been completed successfully. No audio was captured.</p>
            <div className="modal-actions">
              <button className="cta-btn" onClick={() => navigate("/")}>Go to Dashboard</button>
              <button className="ghost-btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </main>
  );
}
