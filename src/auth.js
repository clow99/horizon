import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Check if user exists in database
        const existingUser = await query(
          'SELECT id FROM users WHERE email = ?',
          [user.email]
        );

        if (existingUser.length === 0) {
          // Create new user
          const userId = uuidv4();
          await query(
            'INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)',
            [userId, user.email, user.name, user.image]
          );
          user.id = userId;
        } else {
          // Update existing user info
          await query(
            'UPDATE users SET name = ?, image = ? WHERE email = ?',
            [user.name, user.image, user.email]
          );
          user.id = existingUser[0].id;
        }
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        // Get user id from database
        const dbUser = await query(
          'SELECT id FROM users WHERE email = ?',
          [session.user.email]
        );
        
        if (dbUser.length > 0) {
          session.user.id = dbUser[0].id;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
