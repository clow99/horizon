import { NextResponse } from "next/server";
import {
  resetTestDatabase,
  clearAllTables,
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

function decodeSessionFromHeaders(headers) {
  const encodedSession = headers.get(SESSION_HEADER);
  if (!encodedSession) return null;

  try {
    return decodePlaywrightSession(encodedSession);
  } catch (error) {
    throw new Error("Invalid session payload provided");
  }
}

function ensureUserSeed(sessionPayload, bodyUser) {
  const overrides = bodyUser || sessionPayload?.user || {};
  const seeded = seedUser({
    id: overrides.id,
    email: overrides.email,
    name: overrides.name,
    image: overrides.image,
  });
  return seeded;
}

function seedProjectWithTasks(projectInput, defaultUserId) {
  const projectSeed = seedProject({
    user_id: projectInput.user_id || defaultUserId,
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
          category: taskInput.category,
          status: taskInput.status,
          required: taskInput.required ? 1 : 0,
          notes: taskInput.notes,
          updated_by_user_id: taskInput.updated_by_user_id,
          updated_by_user_name: taskInput.updated_by_user_name,
          updated_by_user_image: taskInput.updated_by_user_image,
        })
      )
    : [];

  return { project: projectSeed, tasks };
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
    sessionPayload = decodeSessionFromHeaders(request.headers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  resetTestDatabase();
  clearAllTables();

  const user = ensureUserSeed(sessionPayload, body.user);

  const seededProjects = Array.isArray(body.projects)
    ? body.projects.map((projectInput) =>
        seedProjectWithTasks(projectInput, user.id)
      )
    : [];

  return NextResponse.json({
    status: "ok",
    user,
    projects: seededProjects,
  });
}
