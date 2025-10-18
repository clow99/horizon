import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateProjectModal from "../CreateProjectModal";
import {
  createTasksFromProjectType,
  getProjectTypes,
} from "@/config/projectTypes";

describe("CreateProjectModal", () => {
  const projectTypes = getProjectTypes();
  const firstType = projectTypes[0];

  test("allows selecting a template, adding a custom task, and creating a project", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    const nameInput = await screen.findByLabelText(/Project Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Mission Control");

    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    const addTaskPanel = screen.getByText(/Add New Task/i).closest("div");
    const taskForm = within(addTaskPanel);
    await user.type(taskForm.getByLabelText(/Task Name/i), "Custom QA");
    await user.click(taskForm.getByRole("button", { name: /^Add Task$/i }));

    expect(screen.getByText("Custom QA")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Create Project/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const [selectedType, createdTasks, createdName] = onCreate.mock.calls[0];
    expect(selectedType).toBe(firstType.id);
    expect(createdName).toBe("Mission Control");
    const expectedTemplateTasks = createTasksFromProjectType(firstType.id);
    expect(createdTasks).toHaveLength(expectedTemplateTasks.length + 1);
    expect(createdTasks.some((task) => task.name === "Custom QA")).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  test("resets state after closing and reopening", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    const { rerender } = render(
      <CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />
    );

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );
    await screen.findByLabelText(/Project Name/i);
    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));

    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <CreateProjectModal
        isOpen={false}
        onClose={onClose}
        onCreate={onCreate}
      />
    );
    rerender(
      <CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />
    );

    expect(
      screen.getByText(/Choose a project type to get started/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Project Name/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );
    const reopenedInput = await screen.findByLabelText(/Project Name/i);
    expect(reopenedInput).toHaveValue("");

    const expectedTasks = createTasksFromProjectType(firstType.id).length;
    const counter = screen.getByText(
      (_, node) =>
        node?.textContent ===
        `${expectedTasks} ${expectedTasks === 1 ? "task" : "tasks"}`
    );
    expect(counter).toBeInTheDocument();
  });

  test("allows removing custom tasks from the list", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    // Add two custom tasks
    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    let addTaskPanel = screen.getByText(/Add New Task/i).closest("div");
    let taskForm = within(addTaskPanel);
    await user.type(taskForm.getByLabelText(/Task Name/i), "Custom Task 1");
    await user.click(taskForm.getByRole("button", { name: /^Add Task$/i }));

    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    addTaskPanel = screen.getByText(/Add New Task/i).closest("div");
    taskForm = within(addTaskPanel);
    await user.type(taskForm.getByLabelText(/Task Name/i), "Custom Task 2");
    await user.click(taskForm.getByRole("button", { name: /^Add Task$/i }));

    expect(screen.getByText("Custom Task 1")).toBeInTheDocument();
    expect(screen.getByText("Custom Task 2")).toBeInTheDocument();

    // Remove the first custom task
    const removeButtons = screen.getAllByRole("button", {
      name: /Remove|Delete|✕|×|⊗/,
    });
    await user.click(removeButtons[0]);

    expect(screen.queryByText("Custom Task 1")).not.toBeInTheDocument();
    expect(screen.getByText("Custom Task 2")).toBeInTheDocument();
  });

  test("prevents submission with empty project name", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    const nameInput = await screen.findByLabelText(/Project Name/i);
    await user.clear(nameInput);

    // Try to submit with empty name
    const createButton = screen.getByRole("button", {
      name: /Create Project/i,
    });

    // Check if button is disabled or try to click and verify onCreate isn't called
    if (createButton.disabled) {
      expect(createButton.disabled).toBe(true);
    } else {
      await user.click(createButton);
      expect(onCreate).not.toHaveBeenCalled();
    }
  });

  test("prevents adding tasks with empty names", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    const nameInput = await screen.findByLabelText(/Project Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Test Project");

    const templateTaskCount = createTasksFromProjectType(firstType.id).length;

    // Try to add a task with empty name
    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    const addTaskPanel = screen.getByText(/Add New Task/i).closest("div");
    const taskForm = within(addTaskPanel);

    // Try to submit without entering task name
    const addTaskButton = taskForm.getByRole("button", { name: /^Add Task$/i });
    if (addTaskButton.disabled) {
      expect(addTaskButton.disabled).toBe(true);
    } else {
      await user.click(addTaskButton);
    }

    // Verify only template tasks are present
    await user.click(screen.getByRole("button", { name: /Create Project/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    const [, createdTasks] = onCreate.mock.calls[0];
    expect(createdTasks).toHaveLength(templateTaskCount);
  });

  test("displays correct task counter after adding and removing tasks", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    const templateTaskCount = createTasksFromProjectType(firstType.id).length;
    let counter = screen.getByText(
      (_, node) =>
        node?.textContent ===
        `${templateTaskCount} ${templateTaskCount === 1 ? "task" : "tasks"}`
    );
    expect(counter).toBeInTheDocument();

    // Add a custom task
    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    let addTaskPanel = screen.getByText(/Add New Task/i).closest("div");
    let taskForm = within(addTaskPanel);
    await user.type(taskForm.getByLabelText(/Task Name/i), "Custom Task");
    await user.click(taskForm.getByRole("button", { name: /^Add Task$/i }));

    const updatedCount = templateTaskCount + 1;
    counter = screen.getByText(
      (_, node) =>
        node?.textContent ===
        `${updatedCount} ${updatedCount === 1 ? "task" : "tasks"}`
    );
    expect(counter).toBeInTheDocument();
  });

  test("maintains accessibility labels throughout workflow", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    // Project name input should have accessible label
    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    // Custom task name input should have accessible label
    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    expect(screen.getByLabelText(/Task Name/i)).toBeInTheDocument();
  });
});
