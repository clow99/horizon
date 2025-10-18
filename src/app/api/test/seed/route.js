import { NextResponse } from "next/server";
import {
  seedUser,
  seedProject,
  seedTask,
} from "../../../../../tests/setup/database.js";
import { decodePlaywrightSession } from "../../../../../tests/setup/auth-session.js";

export const runtime = "nodejs";

const TOKEN_HEADER = "x-nextauth-test-token";
const SESSION_HEADER = "x-nextauth-test-session";

function isTestEnvironment() {
  return process.env.NODE_ENV === "test";
}

function unauthorized(message) {
  return NextResponse.json({ error: message }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

function decodeSession(headers) {
  const encoded = headers.get(SESSION_HEADER);
  if (!encoded) return null;

  try {
    return decodePlaywrightSession(encoded);
  } catch (error) {
    throw new Error("Invalid session payload provided");
  }
}

function seedUsers(users = []) {
  return users.map((userInput) =>
    seedUser({
      id: userInput.id,
      email: userInput.email,
      name: userInput.name,
      image: userInput.image,
      created_at: userInput.created_at,
      updated_at: userInput.updated_at,
    })
  );
}

function seedProjects(projects = [], fallbackUserId) {
  return projects.map((projectInput) => {
    const projectSeed = seedProject({
      user_id: projectInput.user_id || fallbackUserId,
      id: projectInput.id,
      name: projectInput.name,
      description: projectInput.description,
      client: projectInput.client,
      target_date: projectInput.target_date,
      status: projectInput.status,
      project_type: projectInput.project_type,
      display_order: projectInput.display_order,
      archived: projectInput.archived ? 1 : 0,
      archived_at: projectInput.archived_at || null,
    });

    const tasks = Array.isArray(projectInput.tasks)
      ? projectInput.tasks.map((taskInput) =>
          seedTask({
            project_id: projectSeed.id,
            id: taskInput.id,
            name: taskInput.name,
            status: taskInput.status,
            category: taskInput.category,
            required: taskInput.required ? 1 : 0,
            notes: taskInput.notes,
            updated_by_user_id: taskInput.updated_by_user_id,
            updated_by_user_name: taskInput.updated_by_user_name,
            updated_by_user_image: taskInput.updated_by_user_image,
          })
        )
      : [];

    return { project: projectSeed, tasks };
  });
}

export async function POST(request) {
  if (!isTestEnvironment()) {
    return notFound();
  }

  const token = request.headers.get(TOKEN_HEADER);
  if (!token || token !== process.env.NEXTAUTH_TEST_TOKEN) {
    return unauthorized("Invalid test token");
  }

  let body = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  let sessionPayload = null;
  try {
    sessionPayload = decodeSession(request.headers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const seededUsers = Array.isArray(body.users)
    ? seedUsers(body.users)
    : [];

  const fallbackUserId =
    body.defaultUserId ||
    sessionPayload?.user?.id ||
    seededUsers[0]?.id ||
    undefined;

  const seededProjects = Array.isArray(body.projects)
    ? seedProjects(body.projects, fallbackUserId)
    : [];

  return NextResponse.json({
    status: "ok",
    users: seededUsers,
    projects: seededProjects,
  });
}
