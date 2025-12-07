import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import { compare } from "bcrypt";
const differenceInHours = (dateLeft: Date, dateRight: Date) =>
  Math.floor((dateLeft.getTime() - dateRight.getTime()) / 36e5);
import { createAndSendVerificationToken, verifyToken } from "@/src/lib/verificationService";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const passwordMatch = await compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error("Invalid email or password");
        }

        // Require verification if not verified or last login over 24h ago
        const needsFreshVerification =
          !user.emailVerified ||
          (user.lastLogin && differenceInHours(new Date(), user.lastLogin) >= 24);

        if (needsFreshVerification) {
          try {
            await createAndSendVerificationToken(user.email, user.name || user.username || "User");
          } catch (err) {
            console.error("Failed to send verification token during login:", err);
          }
          throw new Error("VERIFICATION_REQUIRED");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile && profile.email) {
        let existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!existingUser) {
          try {
            existingUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name,
                authProvider: "GOOGLE",
                role: "CUSTOMER",
                emailVerified: true,
              },
            });
          } catch (error) {
            console.error("Error creating Google user:", error);
            return false;
          }
        }

        try {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() },
          });
        } catch (err) {
          console.error("Error updating lastLogin for Google user:", err);
        }

        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          try {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          } catch (error) {
            console.error("Error creating Account record:", error);
            return false;
          }
        }
      }
      
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
