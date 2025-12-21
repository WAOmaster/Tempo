import { UserProfile } from "../types";

// NOTE: In a real production app, this should be in an environment variable.
// Since this is a generated demo, the user must provide their own Client ID.
// Create credentials at https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com";

export const authService = {
  /**
   * Initializes the Google Sign-In client.
   * @param onLoginSuccess Callback with user profile when login succeeds.
   */
  init(onLoginSuccess: (user: UserProfile) => void) {
    if (!(window as any).google) {
      console.warn("Google Identity Services script not loaded.");
      return;
    }

    // Check if we have a mock/demo client ID
    if (GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE")) {
        console.log("Google Login: No Client ID configured.");
    }

    (window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        const user = this.decodeJwt(response.credential);
        if (user) {
          localStorage.setItem('tempo-user', JSON.stringify(user));
          onLoginSuccess(user);
        }
      }
    });
  },

  /**
   * Renders the Google Sign-In button.
   */
  renderButton(element: HTMLElement) {
    if (!(window as any).google) return;
    
    (window as any).google.accounts.id.renderButton(
      element,
      { theme: "outline", size: "large", type: "standard", shape: "pill" }  // customization attributes
    );
  },

  /**
   * Simple JWT decode for Google ID tokens (Frontend only).
   */
  decodeJwt(token: string): UserProfile | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      return {
        name: payload.name,
        email: payload.email,
        picture: payload.picture
      };
    } catch (e) {
      console.error("Failed to decode JWT", e);
      return null;
    }
  },

  getUser(): UserProfile | null {
    const saved = localStorage.getItem('tempo-user');
    return saved ? JSON.parse(saved) : null;
  },

  logout() {
    localStorage.removeItem('tempo-user');
    if ((window as any).google) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }
};