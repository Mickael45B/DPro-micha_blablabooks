import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./presentation/styles/reset.css";

import "./presentation/styles/rootColor.css";
import "./presentation/styles/rootContent.css";

import "./presentation/styles/MediaQueries.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
	<App />,
);
