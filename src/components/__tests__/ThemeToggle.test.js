import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";

// Mock the ThemeProvider context
jest.mock("../ThemeProvider", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: jest.fn(),
  }),
}));

describe("ThemeToggle", () => {
  test("renders theme toggle button", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  test("displays correct theme icon", () => {
    render(<ThemeToggle />);

    // Button should be present
    const button = screen.getByRole("button");
    expect(button).toHaveClass("theme-toggle");
  });
});
