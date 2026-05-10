import React from "react";
import "./Login.scss"; // Import the styles for the Login component

const Login = () => {
  const authUrl = import.meta.env.VITE_AUTH_URL;
  
  return (
    <div className="login__wrapper"> {/* Wrapper div for centering the login content */}
      <div className="login"> {/* Main login container */}
        <h2 className="login__title">Welcome back! Ready to dive back in?</h2> {/* Login title/message */}
        
        {/* Link to trigger Google OAuth */}
        <a
          href={`${authUrl}/auth/google`} // URL to your auth server for initiating Google OAuth login
          className="login__google-button" // Custom class for styling the Google sign-in button
        >
          Sign in with Google {/* Text inside the Google sign-in button */}
        </a>
      </div>
    </div>
  );
};

export default Login; // Exporting the Login component for use in other parts of the app