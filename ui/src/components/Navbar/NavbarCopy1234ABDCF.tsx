import { useNavigate } from "react-router";
import CtaIcon from "../../assets/CtaIcon/CtaIcon";
import BackIcon from "../../assets/BackIcon/BackIcon";
import RecordIcon from "../../assets/RecordIcon/RecordIcon";

type NavbarProps = {
  showCtas?: boolean;
  showBackBtn?: boolean;               // when true, show Back instead of "ff"
  recordMeetingHandler?: () => void;
  uploadMeetingHandler?: () => void;
};

export default function Navbar({
  showCtas = false,
  showBackBtn = true,
  recordMeetingHandler,
  uploadMeetingHandler,
}: NavbarProps) {
  const navigate = useNavigate();


  const goBack = () => {
    navigate("/");
  }

  return (
    <header className="dash-header">
      {showBackBtn ? (
        <button className="back-btn" onClick={() => navigate("/")} aria-label="Go back">
          <BackIcon />
          <span>Back</span>
        </button>
      ) : (
        <div
          className="logo-circle"
          aria-hidden="true"
          onClick={goBack}
          role="button"
          title="Go to Dashboard"
        >
          ff
        </div>
      )}

      {/* spacer column (keeps grid structure tidy) */}
      <div />

      {showCtas && (
        <div className="dash-ctas">
          <button className="cta-btn" onClick={uploadMeetingHandler} aria-label="Upload Meeting Audio">
            <CtaIcon />
            <span>Upload Meeting Audio</span>
          </button>
          <button className="cta-btn" onClick={recordMeetingHandler} aria-label="Record New Meeting">
            <RecordIcon />
            <span>Record New Meeting</span>
          </button>
        </div>
      )}
    </header>
  );
}