"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AppHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Home Link */}
        <Link
          href="/home"
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <Image
            src="/favicon.ico"
            alt="App Logo"
            width={40}
            height={40}
            className="mr-2 rounded"
          />
          <span className="font-bold text-xl">VotingApp</span>
        </Link>

        <nav className="flex items-center space-x-6">
          {/* Add Event Button */}
        <button 
        onClick={() => router.push("api/add")} 
        className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Add Event</span>
      </button>

          {/* Share Button */}
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span>Share</span>
          </button>

          {/* Profile and Sign Out */}
          {session && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src={session.user?.image || "/eventImage/userprofile.png"}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full mr-2 border border-gray-200"
                />
                <span>Profile</span>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
