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

  test("allows editing an existing task in the template", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    // Find the first task and edit it
    const tasks = await screen.findAllByRole("button", { name: /edit task/i });
    await user.click(tasks[0]);

    // Find and modify the task name
    const nameInputs = screen.getAllByDisplayValue(/Task/);
    const taskNameInput = nameInputs.find(
      (input) => input.placeholder === undefined
    );
    await user.clear(taskNameInput);
    await user.type(taskNameInput, "Modified Task Name");

    // Save the edit
    const doneButtons = screen.getAllByRole("button", { name: /^Done$/i });
    await user.click(doneButtons[0]);

    expect(screen.getByText("Modified Task Name")).toBeInTheDocument();
  });

  test("allows deleting a template task with confirmation", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    const initialTasks = await screen.findAllByRole("button", {
      name: /delete task/i,
    });
    const initialCount = initialTasks.length;

    // Click first delete button
    await user.click(initialTasks[0]);

    // Confirm deletion
    const confirmButton = screen.getByRole("button", {
      name: /^Remove Task$/i,
    });
    await user.click(confirmButton);

    // Verify task count decreased
    const remainingTasks = screen.queryAllByRole("button", {
      name: /delete task/i,
    });
    expect(remainingTasks.length).toBe(initialCount - 1);
  });

  test("does not allow creating a project with empty task name", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    // Try to add a task without a name
    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    const addTaskPanel = screen.getByText(/Add New Task/i).closest("div");
    const taskForm = within(addTaskPanel);

    const addButton = taskForm.getByRole("button", { name: /^Add Task$/i });
    expect(addButton).toBeDisabled();
  });

  test("cancels task addition and returns to task list", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    const initialCount = screen.getByText((_, node) => {
      const text = node?.textContent;
      return (
        text &&
        text.match(/\d+ tasks?/) &&
        node.className?.includes("text-gray-600")
      );
    });

    // Open add task form
    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    const cancelButton = screen.getAllByRole("button", {
      name: /^Cancel$/i,
    })[0];
    await user.click(cancelButton);

    // Add task form should be hidden
    expect(screen.queryByText(/Add New Task/i)).not.toBeInTheDocument();
  });

  test("displays correct task count and validates form submission", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    const projectNameInput = await screen.findByLabelText(/Project Name/i);
    await user.type(projectNameInput, "Test Project");

    // Add a custom task
    await user.click(screen.getByRole("button", { name: /^Add Task$/i }));
    const addTaskPanel = screen.getByText(/Add New Task/i).closest("div");
    const taskForm = within(addTaskPanel);
    await user.type(taskForm.getByLabelText(/Task Name/i), "New Task");
    await user.click(taskForm.getByRole("button", { name: /^Add Task$/i }));

    // Submit the project
    await user.click(screen.getByRole("button", { name: /Create Project/i }));

    expect(onCreate).toHaveBeenCalledWith(
      firstType.id,
      expect.arrayContaining([expect.objectContaining({ name: "New Task" })]),
      "Test Project"
    );
  });

  test("back button returns to project type selection from task editing", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onCreate = jest.fn();

    render(<CreateProjectModal isOpen onClose={onClose} onCreate={onCreate} />);

    await user.click(
      screen.getByRole("button", { name: new RegExp(firstType.name, "i") })
    );

    // Ensure we're on the task editing step
    await screen.findByLabelText(/Project Name/i);

    // Click back button
    const backButton = screen.getByRole("button", { name: /^Back$/i });
    await user.click(backButton);

    // Should return to project type selection
    expect(
      screen.getByText(/Choose a project type to get started/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Project Name/i)).not.toBeInTheDocument();
  });
});
