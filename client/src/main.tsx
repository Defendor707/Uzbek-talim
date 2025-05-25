import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Using material icons from Google
const iconStyle = document.createElement('link');
iconStyle.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
iconStyle.rel = "stylesheet";
document.head.appendChild(iconStyle);

// Using Roboto and Open Sans fonts
const fontStyle = document.createElement('link');
fontStyle.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600&display=swap";
fontStyle.rel = "stylesheet";
document.head.appendChild(fontStyle);

// Set document title
document.title = "O'zbek Talim - Ta'lim Platformasi";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
