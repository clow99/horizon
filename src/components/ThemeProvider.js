"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage on the client side
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : "light";
    }
    return "light";
  });
  const [mounted, setMounted] = useState(false);

  // Set mounted flag after first render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme with localStorage and document class
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      console.log("ThemeProvider mounted, savedTheme:", savedTheme);

      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        console.log(
          "Applied saved theme:",
          savedTheme,
          "HTML classes:",
          document.documentElement.className
        );
      } else {
        // Check system preference if no saved theme
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        const initialTheme = prefersDark ? "dark" : "light";
        setTheme(initialTheme);
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        // Save the initial preference
        localStorage.setItem("theme", initialTheme);
        console.log(
          "Applied system theme:",
          initialTheme,
          "HTML classes:",
          document.documentElement.className
        );
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("Toggling theme from", theme, "to", newTheme);
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      console.log("Added dark class to html element");
    } else {
      document.documentElement.classList.remove("dark");
      console.log("Removed dark class from html element");
    }

    console.log("HTML classes:", document.documentElement.className);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
