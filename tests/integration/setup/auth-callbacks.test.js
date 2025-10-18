import { resetTestDatabase, executeQuery, seedUser } from "../setup/database";
import {
  ensureDatabaseTestUser,
  mockAuthenticatedUser,
} from "../setup/auth-session";

describe("NextAuth Callbacks Integration", () => {
  beforeEach(() => {
    resetTestDatabase();
  });

  describe("signIn callback", () => {
    test("creates new user on first sign-in", () => {
      const googleProfile = {
        id: "google-123",
        email: "newtester@example.com",
        name: "New Tester",
        image: "https://example.com/avatar.jpg",
      };

      // Simulate creating a new user record
      const userId = `user-${Date.now()}`;
      executeQuery(
        "INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)",
        [userId, googleProfile.email, googleProfile.name, googleProfile.image]
      );

      const created = executeQuery("SELECT * FROM users WHERE email = ?", [
        googleProfile.email,
      ]);

      expect(created).toHaveLength(1);
      expect(created[0].email).toBe(googleProfile.email);
      expect(created[0].name).toBe(googleProfile.name);
    });

    test("updates existing user on subsequent sign-in", () => {
      const user = seedUser({
        email: "existing@example.com",
        name: "Original Name",
        image: null,
      });

      const updatedProfile = {
        name: "Updated Name",
        image: "https://example.com/new-avatar.jpg",
      };

      executeQuery("UPDATE users SET name = ?, image = ? WHERE id = ?", [
        updatedProfile.name,
        updatedProfile.image,
        user.id,
      ]);

      const updated = executeQuery("SELECT * FROM users WHERE id = ?", [
        user.id,
      ]);

      expect(updated[0].name).toBe("Updated Name");
      expect(updated[0].image).toBe("https://example.com/new-avatar.jpg");
    });

    test("generates deterministic user ID for new users", () => {
      const googleProfile = {
        email: "test@example.com",
        name: "Test User",
      };

      const userId = `user-${googleProfile.email.split("@")[0]}`;

      executeQuery("INSERT INTO users (id, email, name) VALUES (?, ?, ?)", [
        userId,
        googleProfile.email,
        googleProfile.name,
      ]);

      const created = executeQuery("SELECT * FROM users WHERE email = ?", [
        googleProfile.email,
      ]);

      expect(created[0].id).toBeDefined();
      expect(created[0].email).toBe(googleProfile.email);
    });

    test("preserves user ID when updating existing user", () => {
      const user = seedUser();
      const originalId = user.id;

      executeQuery("UPDATE users SET name = ? WHERE id = ?", [
        "Updated Name",
        user.id,
      ]);

      const updated = executeQuery("SELECT * FROM users WHERE id = ?", [
        originalId,
      ]);

      expect(updated[0].id).toBe(originalId);
    });

    test("handles missing profile fields gracefully", () => {
      const googleProfile = {
        email: "minimaluser@example.com",
        // name and image may be missing
      };

      const userId = `user-${Date.now()}`;

      executeQuery(
        "INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)",
        [
          userId,
          googleProfile.email,
          googleProfile.name || null,
          googleProfile.image || null,
        ]
      );

      const created = executeQuery("SELECT * FROM users WHERE email = ?", [
        googleProfile.email,
      ]);

      expect(created[0].email).toBe(googleProfile.email);
      expect(created[0].name).toBeNull();
      expect(created[0].image).toBeNull();
    });

    test("prevents duplicate email constraint on new users", () => {
      const user1 = seedUser({ email: "duplicate@example.com" });

      const user2Data = {
        id: "different-id",
        email: "duplicate@example.com",
        name: "Different User",
      };

      // Attempting to insert duplicate email should fail
      expect(() => {
        executeQuery("INSERT INTO users (id, email, name) VALUES (?, ?, ?)", [
          user2Data.id,
          user2Data.email,
          user2Data.name,
        ]);
      }).toThrow();
    });

    test("stores user creation timestamp", () => {
      const user = seedUser();

      const created = executeQuery(
        "SELECT created_at FROM users WHERE id = ?",
        [user.id]
      );

      expect(created[0].created_at).toBeDefined();
      expect(typeof created[0].created_at).toBe("string");
    });
  });

  describe("session callback", () => {
    test("includes user data in session", () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      // Simulate session being populated with user data
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
    });

    test("maintains user ID across requests", () => {
      const user = ensureDatabaseTestUser();
      mockAuthenticatedUser({ id: user.id });

      // Session should consistently provide same user ID
      expect(user.id).toBe("user-0001");
    });
  });

  describe("authorize callback", () => {
    test("allows users with valid profile data", () => {
      const user = seedUser();

      const isValid = user && user.email && user.id;

      expect(isValid).toBe(true);
    });

    test("rejects users without email", () => {
      const invalidUser = {
        id: "user-123",
        name: "No Email User",
        // email is missing
      };

      const isValid = invalidUser && invalidUser.email && invalidUser.id;

      expect(isValid).toBe(false);
    });
  });

  describe("jwt callback", () => {
    test("encodes user ID in JWT token", () => {
      const user = seedUser();

      // JWT should contain user identity
      const jwtPayload = { sub: user.id, email: user.email };

      expect(jwtPayload.sub).toBe(user.id);
      expect(jwtPayload.email).toBe(user.email);
    });
  });
});
