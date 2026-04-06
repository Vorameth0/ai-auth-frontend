import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-zhqwjjxhme75mjyx.us.auth0.com"
      clientId="zhZZ85iB8yV6ISwSg83ogqOmj8uzwwAf"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://my-api", // 🔥 ตัวนี้ MUST HAVE
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);