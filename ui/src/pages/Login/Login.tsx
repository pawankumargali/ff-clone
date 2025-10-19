import { API_ENDPOINTS } from '../../services/api.service';
import "./Login.css";
import GoogleIcon from '../../assets/GoogleIcon/GoogleIcon';


export default function Login() {
  const handleGoogle = () => {
    // Default: redirect to your backend OAuth start endpoint
    window.location.href = API_ENDPOINTS.GOOGLE_LOGIN;
  };

  return (
    <main className="login-root">
      <div className="login-card" role="dialog" aria-labelledby="app-title" aria-describedby="app-subtitle">
        <div className="logo-circle" aria-hidden="true">ff</div>
        <h1 id="app-title" className="title">Welcome to <span className="brand">ff-clone</span></h1>
        <p className="subtitle">Your meetings, neatly organized</p>
        <p id="app-subtitle" className="subtitle">Sign in to continue</p>

        <button className="google-btn" onClick={handleGoogle} aria-label="Continue with Google">
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        <footer className="footer">
          <small>By continuing, you agree to the Terms & Privacy.</small>
        </footer>
      </div>
    </main>
  );
}
