import React, { useState, useEffect } from "react";
import Dropdown from "../ui/Dropdown";

const ThemeSelector = ({ className }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "black", label: "Black" },
    { value: "claude", label: "Claude" },
    { value: "corporate", label: "Corporate" },
    { value: "gourmet", label: "Gourmet" },
    { value: "luxury", label: "Luxury" },
    { value: "mintlify", label: "Mintlify" },
    { value: "pastel", label: "Pastel" },
    { value: "perplexity", label: "Perplexity" },
    { value: "shadcn", label: "Shadcn" },
    { value: "slack", label: "Slack" },
  ];

  return (
    <Dropdown
      options={themeOptions}
      value={theme}
      onChange={setTheme}
      placeholder="Select Theme"
      className={className || "w-40"}
    />
  );
};

export default ThemeSelector;
