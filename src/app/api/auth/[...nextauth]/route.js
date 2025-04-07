import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

// MongoDB connection URI
const client = new MongoClient(process.env.MONGODB_URI);

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        // Connect to MongoDB
        await client.connect();
        const db = client.db();
        const usersCollection = db.collection("users");

        // Find the user by email
        const user = await usersCollection.findOne({ email });

        // Check if the user exists and the password is valid
        if (user && (await bcrypt.compare(password, user.password))) {
          // If valid, return user data
          return { id: user._id, email: user.email };
        } else {
          throw new Error("Invalid email or password");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login", // Custom login page
    error: "/auth/error", // Custom error page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
