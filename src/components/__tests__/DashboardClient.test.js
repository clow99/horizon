import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardClient from "../DashboardClient";

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

jest.mock("@/components/ProjectChecklist", () => ({ project }) => (
  <div data-testid={`checklist-${project.id}`}>{project.name}</div>
));

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

const createModalSpy = jest.fn();
jest.mock(
  "@/components/CreateProjectModal",
  () =>
    ({ isOpen, onCreate, onClose }) => {
      createModalSpy({ isOpen, onCreate, onClose });
      if (!isOpen) return null;
      return (
        <div data-testid="create-project-modal">
          <button
            onClick={() =>
              onCreate(
                "deployment",
                [{ id: "task-modal", status: "Completed", required: true }],
                "Modal Project"
              )
            }
          >
            Confirm Modal Project
          </button>
          <button onClick={onClose}>Close Modal</button>
        </div>
      );
    }
);

const baseProjects = [
  {
    id: "alpha",
    name: "Alpha",
    display_order: 2,
    tasks: [
      { id: "a-1", status: "Completed", required: true },
      { id: "a-2", status: "In Progress", required: true },
    ],
  },
  {
    id: "beta",
    name: "Beta",
    display_order: 1,
    tasks: [
      { id: "b-1", status: "Completed", required: false },
      { id: "b-2", status: "Completed", required: true },
    ],
  },
];

const session = { user: { name: "Tester" } };

describe("DashboardClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("renders progress metrics for active projects", () => {
    render(
      <DashboardClient initialProjects={baseProjects} session={session} />
    );

    const progressCard = screen.getByText(/Overall Progress/i).closest("div");
    expect(within(progressCard).getByText("75%")).toBeInTheDocument();

    const readyCard = screen.getByText(/Ready to Deploy/i).closest("div");
    expect(within(readyCard).getByText("1")).toBeInTheDocument();

    const tasksCard = screen.getByText(/Tasks Completed/i).closest("div");
    expect(within(tasksCard).getByText(/3\/4/)).toBeInTheDocument();

    const totalsCard = screen.getByText(/Total Projects/i).closest("div");
    expect(within(totalsCard).getByText("2")).toBeInTheDocument();
  });

  test("adds a project optimistically and rolls back on API failure", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue("error"),
    });

    const user = userEvent.setup();
    render(
      <DashboardClient initialProjects={baseProjects} session={session} />
    );

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    expect(screen.getByTestId("create-project-modal")).toBeInTheDocument();

    await user.click(screen.getByText(/Confirm Modal Project/i));

    expect(screen.getByText("Modal Project")).toBeInTheDocument();

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    await waitFor(() =>
      expect(screen.queryByText("Modal Project")).not.toBeInTheDocument()
    );

    expect(
      screen.getByText("Failed to create project. Please try again.")
    ).toBeInTheDocument();
  });

  test("replaces temporary project with server response on success", async () => {
    const createdProject = {
      id: "server-project",
      name: "Server Project",
      tasks: [],
      target_date: "2025-05-01",
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(createdProject),
    });

    const user = userEvent.setup();
    render(
      <DashboardClient initialProjects={baseProjects} session={session} />
    );

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    await user.click(screen.getByText(/Confirm Modal Project/i));

    expect(screen.getByText("Modal Project")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Server Project")).toBeInTheDocument()
    );

    expect(screen.queryByText("Modal Project")).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
  });
});
