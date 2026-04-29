import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  callbacks: {
    // ── signIn: Create or link user in MongoDB ─────────────────────────────
    async signIn({ account, profile }) {
      if (account.provider !== 'google') return true;

      try {
        await connectDB();

        const existingUser = await User.findOne({ email: profile.email });

        if (!existingUser) {
          // New user — use insertOne via User() + save bypass with direct insert
          await User.collection.insertOne({
            name: profile.name,
            email: profile.email.toLowerCase(),
            avatar: profile.picture || '',
            provider: 'google',
            googleId: profile.sub,
            passwordHash: undefined,
            onboardingComplete: false,
            profileScore: 30,
            skills: [],
            savedJobs: [],
            completedModules: [],
            currentStatus: '',
            targetRole: '',
            experienceLevel: '',
            preferredLocation: '',
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Link Google account to existing user (never triggers pre-save hooks)
          await User.updateOne(
            { _id: existingUser._id },
            {
              $set: {
                googleId: profile.sub,
                ...(existingUser.avatar ? {} : { avatar: profile.picture || '' }),
                lastActive: new Date(),
              },
            }
          );
        }

        return true;
      } catch (error) {
        console.error('[GOOGLE SIGNIN ERROR]:', error);
        // Still return true — user is authenticated by Google even if DB sync fails
        return true;
      }
    },

    // ── jwt: Attach userId to the JWT token ────────────────────────────────
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: profile.email });
          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.onboardingComplete = dbUser.onboardingComplete;
          }
        } catch (error) {
          console.error('[JWT CALLBACK ERROR]:', error);
        }
      }
      return token;
    },

    // ── session: Expose userId to client session ───────────────────────────
    async session({ session, token }) {
      if (token?.userId) {
        session.user.userId = token.userId;
        session.user.onboardingComplete = token.onboardingComplete;
      }
      return session;
    },

    // ── redirect: Just respect the callbackUrl set by the sign-in button ───
    async redirect({ url, baseUrl }) {
      // If the URL is internal (starts with our app), use it as-is
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
  },
};

export default NextAuth(authOptions);
