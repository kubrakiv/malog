import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import "./styles/styles.scss";
import store from "./store";
import { configureAxiosAuth } from "./utils/configureAxiosAuth";

configureAxiosAuth();

const rootElement: HTMLElement | null = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
} else {
  console.error("Root element not found");
}
