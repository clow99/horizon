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
});
