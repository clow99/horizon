import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileClient from "../ProfileClient";

jest.mock("next/image", () => (props) => (
  <img alt={props.alt || ""} {...props} />
));

const mockRouter = { refresh: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("next-auth/react", () => ({ signOut: jest.fn() }));

jest.mock("next/link", () => ({ children, ...props }) => (
  <a {...props}>{children}</a>
));

jest.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: jest.fn() }),
}));

jest.mock("@/components/Footer", () => () => (
  <footer data-testid="footer">Footer</footer>
));

jest.mock("@/components/Toast", () => ({ toasts = [], onDismiss }) => (
  <div>
    {toasts.map((toast) => (
      <div
        key={toast.id}
        data-testid="toast"
        onClick={() => onDismiss?.(toast.id)}
      >
        {toast.message}
      </div>
    ))}
  </div>
));

const user = {
  id: "user-1234",
  name: "Taylor Tester",
  email: "taylor@example.com",
  created_at: "2024-03-01T12:00:00Z",
  image: null,
};

describe("ProfileClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    jest.useRealTimers();
  });

  test("validates profile edits before saving", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );
    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.click(
      screen.getByRole("button", { name: /Save Changes/i })
    );

    expect(screen.getByText(/Name cannot be empty/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("saves profile changes and refreshes router", async () => {
    jest.useFakeTimers();
    const userEvents = userEvent.setup({
      advanceTimers: (delay) => jest.advanceTimersByTime(delay),
    });

    global.fetch.mockResolvedValue({ ok: true });

    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );
    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.type(nameInput, "Taylor Updated");

    await userEvents.click(
      screen.getByRole("button", { name: /Save Changes/i })
    );

    expect(global.fetch).toHaveBeenCalledWith("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Taylor Updated" }),
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Profile updated successfully!/i)
      ).toBeInTheDocument()
    );

    jest.advanceTimersByTime(1000);
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: /Full Name/i })
      ).not.toBeInTheDocument()
    );
  });

  test("displays user metadata on profile page", () => {
    render(<ProfileClient user={user} />);

    expect(screen.getByText(/Taylor Tester/i)).toBeInTheDocument();
    expect(screen.getByText(/taylor@example.com/i)).toBeInTheDocument();
  });

  test("shows user ID in profile information", () => {
    render(<ProfileClient user={user} />);

    expect(screen.getByText(/user-1234/i)).toBeInTheDocument();
  });

  test("displays account creation date in readable format", () => {
    render(<ProfileClient user={user} />);

    // The component should display the creation date somewhere
    const createdElement =
      screen.getByText(/Created/i) ||
      screen.getByText(/joined/i) ||
      screen.getByText(/2024/i);
    expect(createdElement).toBeInTheDocument();
  });

  test("shows edit button to trigger edit mode", () => {
    render(<ProfileClient user={user} />);

    const editButton = screen.getByRole("button", { name: /Edit Profile/i });
    expect(editButton).toBeInTheDocument();
  });

  test("reveals edit form when edit button is clicked", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    expect(
      screen.queryByRole("textbox", { name: /Full Name/i })
    ).not.toBeInTheDocument();

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    expect(
      screen.getByRole("textbox", { name: /Full Name/i })
    ).toBeInTheDocument();
  });

  test("pre-fills form with current user data when editing", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    expect(nameInput).toHaveValue("Taylor Tester");
  });

  test("provides cancel button to exit edit mode without saving", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.type(nameInput, "Completely Different Name");

    await userEvents.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(
      screen.queryByRole("textbox", { name: /Full Name/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Taylor Tester/i)).toBeInTheDocument();
  });

  test("displays save and cancel buttons in edit mode", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    expect(
      screen.getByRole("button", { name: /Save Changes/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  test("handles API errors gracefully when saving profile", async () => {
    jest.useFakeTimers();
    const userEvents = userEvent.setup({
      advanceTimers: (delay) => jest.advanceTimersByTime(delay),
    });

    global.fetch.mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue("Server error"),
    });

    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.type(nameInput, "New Name");

    await userEvents.click(
      screen.getByRole("button", { name: /Save Changes/i })
    );

    await waitFor(() =>
      expect(screen.getByText(/Failed to save/i)).toBeInTheDocument()
    );

    jest.useRealTimers();
  });

  test("displays user profile picture if available", () => {
    const userWithImage = {
      ...user,
      image: "https://example.com/avatar.jpg",
    };

    render(<ProfileClient user={userWithImage} />);

    const image = screen.getByAltText(/avatar|profile|user/i);
    expect(image).toBeInTheDocument();
  });

  test("handles null image gracefully", () => {
    render(<ProfileClient user={user} />);

    // Should not crash and should display profile normally
    expect(screen.getByText(/Taylor Tester/i)).toBeInTheDocument();
  });

  test("displays read-only fields when not in edit mode", () => {
    render(<ProfileClient user={user} />);

    // Email and user ID should be displayed as text, not inputs
    expect(screen.getByText(/taylor@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/user-1234/i)).toBeInTheDocument();

    // Should not have input fields in view mode
    expect(
      screen.queryByRole("textbox", { name: /Full Name/i })
    ).not.toBeInTheDocument();
  });

  test("shows loading state during profile save", async () => {
    jest.useFakeTimers();
    const userEvents = userEvent.setup({
      advanceTimers: (delay) => jest.advanceTimersByTime(delay),
    });

    let resolveCreate;
    const savePromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    global.fetch.mockReturnValue(savePromise.then(() => ({ ok: true })));

    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.type(nameInput, "Updated Name");

    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    await userEvents.click(saveButton);

    // Check if save button is disabled or shows loading state
    expect(saveButton).toBeDisabled();

    resolveCreate();

    await waitFor(() => {
      expect(
        screen.getByText(/Profile updated successfully!/i)
      ).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test("maintains edit mode state when validation fails", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.click(
      screen.getByRole("button", { name: /Save Changes/i })
    );

    // Should still be in edit mode after validation failure
    expect(
      screen.getByRole("textbox", { name: /Full Name/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save Changes/i })
    ).toBeInTheDocument();
  });
});
