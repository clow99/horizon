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

  test("displays user profile information correctly", () => {
    render(<ProfileClient user={user} />);

    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    expect(screen.getByText(user.id)).toBeInTheDocument();
  });

  test("displays member since date in correct format", () => {
    render(<ProfileClient user={user} />);

    const memberDate = new Date("2024-03-01T12:00:00Z");
    const formattedDate = memberDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  test("shows edit affordance button when not editing", () => {
    render(<ProfileClient user={user} />);

    const editButton = screen.getByRole("button", { name: /Edit Profile/i });
    expect(editButton).toBeInTheDocument();
    expect(editButton).not.toBeDisabled();
  });

  test("enters edit mode and displays form fields", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );

    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue(user.name);

    expect(screen.getByRole("button", { name: /Save Changes/i }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Cancel$/i }))
      .toBeInTheDocument();
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

  test("handles profile update API failure gracefully", async () => {
    const userEvents = userEvent.setup();
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
      expect(
        screen.getByText(
          /Failed to update profile. Please try again./i
        )
      ).toBeInTheDocument()
    );

    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  test("cancels profile edits and reverts changes", async () => {
    const userEvents = userEvent.setup();
    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );
    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.type(nameInput, "New Name");

    await userEvents.click(
      screen.getByRole("button", { name: /^Cancel$/i })
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText(user.name)).toBeInTheDocument();
  });

  test("disables form buttons while saving", async () => {
    jest.useFakeTimers();
    const userEvents = userEvent.setup({
      advanceTimers: (delay) => jest.advanceTimersByTime(delay),
    });

    global.fetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
    );

    render(<ProfileClient user={user} />);

    await userEvents.click(
      screen.getByRole("button", { name: /Edit Profile/i })
    );
    const nameInput = screen.getByRole("textbox", { name: /Full Name/i });
    await userEvents.clear(nameInput);
    await userEvents.type(nameInput, "New Name");

    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    const cancelButton = screen.getByRole("button", { name: /^Cancel$/i });

    await userEvents.click(saveButton);

    // During save, buttons should be disabled
    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  test("displays user avatar when provided", () => {
    const userWithImage = { ...user, image: "https://example.com/avatar.jpg" };
    render(<ProfileClient user={userWithImage} />);

    const avatar = screen.getByAltText(
      userWithImage.name || "User avatar"
    ) as HTMLImageElement;
    expect(avatar).toBeInTheDocument();
    expect(avatar.src).toContain("avatar.jpg");
  });

  test("handles null created_at date gracefully", () => {
    const userWithoutDate = { ...user, created_at: null };
    render(<ProfileClient user={userWithoutDate} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
