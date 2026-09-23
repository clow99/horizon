import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const authConfig = {
  // Trust proxy headers (needed behind reverse proxies)
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    // A new name expires sessions issued before identity checks were enforced.
    // Auth.js manages the PKCE cookie and its security options itself.
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-horizon.oauth-v2.session-token"
        : "horizon.oauth-v2.session-token",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = typeof profile?.email === "string"
        ? profile.email.trim().toLowerCase()
        : "";
      const userEmail = typeof user?.email === "string"
        ? user.email.trim().toLowerCase()
        : "";
      const subject = profile?.sub;
      if (
        account?.provider !== "google" ||
        profile?.email_verified !== true ||
        !email ||
        typeof subject !== "string" ||
        !subject ||
        account.providerAccountId !== subject ||
        userEmail !== email
      ) {
        return false;
      }

      try {
        // Once associated, the immutable Google subject owns the local account.
        // Keep the stored email because existing data lookups use it.
        const linked = await query(
          "SELECT id, email FROM users WHERE google_sub = ?",
          [subject]
        );
        if (linked.length) {
          await query("UPDATE users SET name = ?, image = ? WHERE id = ?", [
            user.name ?? null,
            user.image ?? null,
            linked[0].id,
          ]);
          user.id = linked[0].id;
          user.email = linked[0].email;
          return true;
        }

        const matchingEmail = await query(
          "SELECT id, email, google_sub FROM users WHERE email = ?",
          [email]
        );
        if (matchingEmail.length) {
          // Gmail addresses cannot be reassigned. Other existing addresses need
          // an authenticated owner recovery before their Google sub is linked.
          if (
            matchingEmail[0].google_sub ||
            !email.endsWith("@gmail.com")
          ) {
            return false;
          }
          const result = await query(
            "UPDATE users SET google_sub = ?, name = ?, image = ? WHERE id = ? AND google_sub IS NULL",
            [subject, user.name ?? null, user.image ?? null, matchingEmail[0].id]
          );
          if (result.affectedRows !== 1) return false;
          user.id = matchingEmail[0].id;
          user.email = matchingEmail[0].email;
          return true;
        }

        const id = uuidv4();
        await query(
          "INSERT INTO users (id, email, name, image, google_sub) VALUES (?, ?, ?, ?, ?)",
          [id, email, user.name ?? null, user.image ?? null, subject]
        );
        user.id = id;
        user.email = email;
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
