import { createRoot } from "react-dom/client";
import { BackgroundPaths } from "@/components/ui/background-paths";
import "./styles.css";

document.querySelectorAll<HTMLElement>("[data-background-paths]").forEach((element) => {
  createRoot(element).render(<BackgroundPaths decorativeOnly />);
});
