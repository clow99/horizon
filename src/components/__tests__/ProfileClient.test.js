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
});
