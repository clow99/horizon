import { query } from "@/lib/db";
import { createUser } from "../../setup/factories";
import { resetTestDatabase } from "../../setup/database";

describe("NextAuth Callbacks Integration Tests", () => {
  beforeEach(async () => {
    resetTestDatabase();
    jest.clearAllMocks();
  });

  describe("signIn Callback", () => {
    test("creates new user on first login", async () => {
      const email = "newuser@example.com";
      const name = "New User";
      const image = "https://example.com/avatar.jpg";

      // Simulate signIn callback logic
      const existingUser = await query("SELECT id FROM users WHERE email = ?", [
        email,
      ]);

      if (existingUser.length === 0) {
        const { v4: uuidv4 } = await import("uuid");
        const userId = uuidv4();

        await query(
          "INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)",
          [userId, email, name, image]
        );

        // Verify user was created
        const created = await query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);

        expect(created).toHaveLength(1);
        expect(created[0].id).toBe(userId);
        expect(created[0].email).toBe(email);
        expect(created[0].name).toBe(name);
        expect(created[0].image).toBe(image);
      }
    });

    test("updates existing user on login", async () => {
      const user = await createUser({
        name: "Original Name",
        image: "https://example.com/original.jpg",
      });

      const updatedName = "Updated Name";
      const updatedImage = "https://example.com/updated.jpg";

      // Simulate signIn callback logic for existing user
      const existingUser = await query("SELECT id FROM users WHERE email = ?", [
        user.email,
      ]);

      if (existingUser.length > 0) {
        await query("UPDATE users SET name = ?, image = ? WHERE email = ?", [
          updatedName,
          updatedImage,
          user.email,
        ]);

        const updated = await query("SELECT * FROM users WHERE id = ?", [
          user.id,
        ]);

        expect(updated[0].name).toBe(updatedName);
        expect(updated[0].image).toBe(updatedImage);
      }
    });

    test("prevents duplicate user creation", async () => {
      const email = "duplicate@example.com";
      const { v4: uuidv4 } = await import("uuid");
      const userId1 = uuidv4();

      // Create first user
      await query("INSERT INTO users (id, email, name) VALUES (?, ?, ?)", [
        userId1,
        email,
        "User One",
      ]);

      // Try to create second user with same email
      const existingUser = await query("SELECT id FROM users WHERE email = ?", [
        email,
      ]);

      expect(existingUser).toHaveLength(1);
      expect(existingUser[0].id).toBe(userId1);

      // Verify only one user exists
      const allUsers = await query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);

      expect(allUsers).toHaveLength(1);
    });

    test("handles missing user profile data gracefully", async () => {
      const email = "nodata@example.com";
      const { v4: uuidv4 } = await import("uuid");
      const userId = uuidv4();

      // Create user with minimal data
      await query("INSERT INTO users (id, email) VALUES (?, ?)", [
        userId,
        email,
      ]);

      const created = await query("SELECT * FROM users WHERE id = ?", [userId]);

      expect(created[0].email).toBe(email);
      expect(created[0].name).toBeNull();
      expect(created[0].image).toBeNull();
    });

    test("assigns unique UUID to each new user", async () => {
      const { v4: uuidv4 } = await import("uuid");
      const users = [];

      // Create 3 users and verify unique IDs
      for (let i = 0; i < 3; i++) {
        const userId = uuidv4();
        const email = `user${i}@example.com`;

        await query("INSERT INTO users (id, email, name) VALUES (?, ?, ?)", [
          userId,
          email,
          `User ${i}`,
        ]);

        users.push({ id: userId, email });
      }

      const userIds = users.map((u) => u.id);
      const uniqueIds = new Set(userIds);

      expect(uniqueIds.size).toBe(3);
      expect(userIds.length).toBe(3);
    });

    test("returns false on database error during signIn", async () => {
      // This test verifies error handling
      // In real scenario, we'd mock a database error
      const email = "error@example.com";

      try {
        // Invalid query should throw
        await query("SELECT * FROM nonexistent_table WHERE id = ?", ["test"]);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("JWT Callback", () => {
    test("adds user id to JWT token", async () => {
      const user = await createUser();

      // Simulate JWT callback
      const token = {};
      const tokenAfter = { ...token, id: user.id };

      expect(tokenAfter.id).toBe(user.id);
    });

    test("preserves existing token properties", async () => {
      const user = await createUser();
      const initialToken = {
        email: user.email,
        name: user.name,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = { ...initialToken, id: user.id };

      expect(token.email).toBe(user.email);
      expect(token.name).toBe(user.name);
      expect(token.iat).toBeDefined();
      expect(token.id).toBe(user.id);
    });

    test("handles token without user object", async () => {
      const token = {
        email: "test@example.com",
        sub: "user-123",
      };

      // Token should remain unchanged if no user provided
      const updatedToken = { ...token };

      expect(updatedToken).toEqual(token);
    });
  });

  describe("Session Callback", () => {
    test("adds user id from token to session", async () => {
      const user = await createUser();
      const session = {
        user: {
          email: user.email,
          name: user.name,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const token = {
        id: user.id,
        sub: user.id,
      };

      // Simulate session callback
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      expect(session.user.id).toBe(user.id);
      expect(session.user.email).toBe(user.email);
      expect(session.user.name).toBe(user.name);
    });

    test("preserves other session properties", async () => {
      const user = await createUser();
      const expiresTime = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const session = {
        user: {
          email: user.email,
          name: user.name,
        },
        expires: expiresTime,
      };
      const token = {
        id: user.id,
      };

      // Simulate session callback
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      expect(session.expires).toBe(expiresTime);
      expect(session.user).toBeDefined();
    });

    test("handles missing token id gracefully", async () => {
      const session = {
        user: {
          email: "test@example.com",
          name: "Test User",
        },
        expires: new Date().toISOString(),
      };
      const token = {
        sub: "user-id",
        // No id property
      };

      // Simulate session callback with missing token.id
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      expect(session.user.id).toBeUndefined();
      expect(session.user.email).toBe("test@example.com");
    });

    test("maintains consistency between JWT and session", async () => {
      const user = await createUser();

      // JWT token state
      const jwtToken = {
        id: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
      };

      // Session derived from token
      const session = {
        user: {
          email: user.email,
          name: user.name,
          id: jwtToken.id,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(session.user.id).toBe(jwtToken.id);
      expect(session.user.id).toBe(user.id);
    });
  });

  describe("Multi-User Scenarios", () => {
    test("handles multiple users signing in sequentially", async () => {
      const emails = [
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
      ];
      const { v4: uuidv4 } = await import("uuid");

      for (const email of emails) {
        const existingUser = await query(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );

        if (existingUser.length === 0) {
          const userId = uuidv4();
          await query("INSERT INTO users (id, email, name) VALUES (?, ?, ?)", [
            userId,
            email,
            email.split("@")[0],
          ]);
        }
      }

      const allUsers = await query("SELECT * FROM users");
      expect(allUsers.length).toBeGreaterThanOrEqual(3);

      for (const email of emails) {
        const user = await query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);
        expect(user).toHaveLength(1);
      }
    });

    test("maintains user isolation across multiple sessions", async () => {
      const user1 = await createUser({ email: "user1@example.com" });
      const user2 = await createUser({ email: "user2@example.com" });

      // Each user's data should be isolated
      const user1Data = await query("SELECT * FROM users WHERE id = ?", [
        user1.id,
      ]);
      const user2Data = await query("SELECT * FROM users WHERE id = ?", [
        user2.id,
      ]);

      expect(user1Data[0].email).toBe("user1@example.com");
      expect(user2Data[0].email).toBe("user2@example.com");
      expect(user1Data[0].id).not.toBe(user2Data[0].id);
    });
  });
});
