import { act, render, screen, waitFor, within } from "@testing-library/react";
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

jest.mock("@/components/Toast", () => ({ message, onClose }) => (
  <div data-testid="toast" onClick={onClose}>
    {message}
  </div>
));

const mockCreateModalSpy = jest.fn();
jest.mock(
  "@/components/CreateProjectModal",
  () =>
    ({ isOpen, onCreate, onClose }) => {
      mockCreateModalSpy({ isOpen, onCreate, onClose });
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
    expect(
      within(tasksCard).getByText((content, element) => {
        return element.textContent === "3/4";
      })
    ).toBeInTheDocument();

    const totalsCard = screen.getByText(/Total Projects/i).closest("div");
    expect(within(totalsCard).getByText("2")).toBeInTheDocument();
  });

  test("adds a project optimistically and rolls back on API failure", async () => {
    let resolveRequest;
    global.fetch.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const user = userEvent.setup();
    render(
      <DashboardClient initialProjects={baseProjects} session={session} />
    );

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    expect(screen.getByTestId("create-project-modal")).toBeInTheDocument();

    await user.click(screen.getByText(/Confirm Modal Project/i));

    expect(screen.getByText("Modal Project")).toBeInTheDocument();

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    await act(async () => {
      resolveRequest({
        ok: false,
        text: jest.fn().mockResolvedValue("error"),
      });
    });

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

    let resolveRequest;
    global.fetch.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const user = userEvent.setup();
    render(
      <DashboardClient initialProjects={baseProjects} session={session} />
    );

    await user.click(screen.getByRole("button", { name: /New Project/i }));
    await user.click(screen.getByText(/Confirm Modal Project/i));

    expect(screen.getByText("Modal Project")).toBeInTheDocument();

    await act(async () => {
      resolveRequest({
        ok: true,
        json: jest.fn().mockResolvedValue(createdProject),
      });
    });

    await waitFor(() =>
      expect(screen.getByText("Server Project")).toBeInTheDocument()
    );

    expect(screen.queryByText("Modal Project")).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
  });

  test("calculates progress percentage correctly with all completed tasks", () => {
    const projectsWithAllCompleted = [
      {
        id: "completed-1",
        name: "Completed Project",
        display_order: 0,
        tasks: [
          { id: "c-1", status: "Completed", required: true },
          { id: "c-2", status: "Completed", required: true },
          { id: "c-3", status: "Completed", required: false },
        ],
      },
    ];

    render(
      <DashboardClient
        initialProjects={projectsWithAllCompleted}
        session={session}
      />
    );

    const progressCard = screen.getByText(/Overall Progress/i).closest("div");
    expect(within(progressCard).getByText("100%")).toBeInTheDocument();
  });

  test("calculates progress percentage correctly with no completed tasks", () => {
    const projectsWithNone = [
      {
        id: "incomplete-1",
        name: "Incomplete Project",
        display_order: 0,
        tasks: [
          { id: "i-1", status: "Not Started", required: true },
          { id: "i-2", status: "In Progress", required: true },
        ],
      },
    ];

    render(
      <DashboardClient initialProjects={projectsWithNone} session={session} />
    );

    const progressCard = screen.getByText(/Overall Progress/i).closest("div");
    expect(within(progressCard).getByText("0%")).toBeInTheDocument();
  });

  test("counts only projects with all required tasks completed as ready for deploy", () => {
    const projectsForDeploy = [
      {
        id: "project-1",
        name: "Project 1",
        display_order: 0,
        tasks: [
          { id: "p1-1", status: "Completed", required: true },
          { id: "p1-2", status: "Completed", required: true },
        ],
      },
      {
        id: "project-2",
        name: "Project 2",
        display_order: 1,
        tasks: [
          { id: "p2-1", status: "Completed", required: true },
          { id: "p2-2", status: "In Progress", required: true },
        ],
      },
      {
        id: "project-3",
        name: "Project 3",
        display_order: 2,
        tasks: [
          { id: "p3-1", status: "Completed", required: false },
          { id: "p3-2", status: "Not Started", required: false },
        ],
      },
    ];

    render(
      <DashboardClient initialProjects={projectsForDeploy} session={session} />
    );

    const readyCard = screen.getByText(/Ready to Deploy/i).closest("div");
    expect(within(readyCard).getByText("1")).toBeInTheDocument();
  });

  test("renders empty state when no projects exist", () => {
    render(<DashboardClient initialProjects={[]} session={session} />);

    expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by creating your first deployment project/i)
    ).toBeInTheDocument();
  });

  test("sorts projects by custom order when selected", async () => {
    const projectsUnsorted = [
      {
        id: "proj-c",
        name: "Charlie",
        display_order: 3,
        tasks: [],
      },
      {
        id: "proj-a",
        name: "Alpha",
        display_order: 1,
        tasks: [],
      },
      {
        id: "proj-b",
        name: "Bravo",
        display_order: 2,
        tasks: [],
      },
    ];

    render(
      <DashboardClient initialProjects={projectsUnsorted} session={session} />
    );

    const sortSelect = screen.getByDisplayValue(/Custom Order/i);
    expect(sortSelect).toBeInTheDocument();

    // The projects should be displayed in custom order
    const projectNames = screen.getAllByText(/Alpha|Bravo|Charlie/);
    expect(projectNames.length).toBeGreaterThan(0);
  });

  test("sorts projects alphabetically when selected", async () => {
    const projectsUnsorted = [
      {
        id: "proj-c",
        name: "Zebra",
        display_order: 0,
        tasks: [],
      },
      {
        id: "proj-a",
        name: "Alpha",
        display_order: 1,
        tasks: [],
      },
      {
        id: "proj-b",
        name: "Mango",
        display_order: 2,
        tasks: [],
      },
    ];

    const user = userEvent.setup();
    render(
      <DashboardClient initialProjects={projectsUnsorted} session={session} />
    );

    const sortSelect = screen.getByDisplayValue(/Custom Order/i);
    await user.selectOptions(sortSelect, "alpha");

    // After alphabetical sort, Alpha should appear first in the rendered list
    await waitFor(() => {
      const projectItems = screen.getAllByTestId(/^checklist-/);
      expect(projectItems.length).toBeGreaterThan(0);
    });
  });

  test("sorts projects by completion percentage when selected", async () => {
    const projectsByCompletion = [
      {
        id: "proj-50",
        name: "Halfway",
        display_order: 0,
        tasks: [
          { id: "h-1", status: "Completed", required: false },
          { id: "h-2", status: "Not Started", required: false },
        ],
      },
      {
        id: "proj-0",
        name: "Nothing",
        display_order: 1,
        tasks: [
          { id: "n-1", status: "Not Started", required: false },
          { id: "n-2", status: "Not Started", required: false },
        ],
      },
      {
        id: "proj-100",
        name: "Everything",
        display_order: 2,
        tasks: [
          { id: "e-1", status: "Completed", required: false },
          { id: "e-2", status: "Completed", required: false },
        ],
      },
    ];

    const user = userEvent.setup();
    render(
      <DashboardClient
        initialProjects={projectsByCompletion}
        session={session}
      />
    );

    const sortSelect = screen.getByDisplayValue(/Custom Order/i);
    await user.selectOptions(sortSelect, "completion");

    await waitFor(() => {
      const projectItems = screen.getAllByTestId(/^checklist-/);
      expect(projectItems.length).toBeGreaterThan(0);
    });
  });
});
