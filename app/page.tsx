"use client";

import { useState } from "react";

export default function Home() {

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white">
      
      {/* NAVBAR */}
      <header className="flex justify-between items-center px-8 py-6">
        <h1 className="text-2xl font-bold tracking-wide">
          Locks<span className="text-emerald-400">All</span>
        </h1>
        <nav className="space-x-6 text-sm">
          <a className="hover:text-emerald-400 cursor-pointer">Home</a>
          <a className="hover:text-emerald-400 cursor-pointer">Features</a>
          <a className="hover:text-emerald-400 cursor-pointer">Contact</a>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="px-10 py-24 text-center">
        <h2 className="text-5xl font-extrabold leading-tight">
          Secure. Smart. <span className="text-emerald-400">Everywhere.</span>
        </h2>

        <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
          LocksAll is the future of unified digital & physical security —
          providing seamless identity-based access control across devices,
          platforms, and environments.
        </p>

        {/* EMAIL FORM */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex justify-center gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to join early access"
              className="px-4 py-3 rounded-lg w-72 text-black"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-lg font-semibold"
            >
              Notify Me
            </button>
          </form>
        ) : (
          <p className="mt-6 text-emerald-300 font-semibold">
            🎉 Thanks! We’ll notify you when the prototype launches.
          </p>
        )}
      </section>

      {/* FEATURE GRID */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-10 pb-20">

        <div className="p-6 bg-gray-900 rounded-xl hover:scale-105 transition">
          <h3 className="text-xl font-bold mb-2">Identity-Driven Security</h3>
          <p className="text-gray-300">
            Smart access policies powered by user identity, behavior patterns, and trust level.
          </p>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl hover:scale-105 transition">
          <h3 className="text-xl font-bold mb-2">Unified Control</h3>
          <p className="text-gray-300">
            Manage devices, credentials, locks, and permissions from a single interface.
          </p>
        </div>

        <div className="p-6 bg-gray-900 rounded-xl hover:scale-105 transition">
          <h3 className="text-xl font-bold mb-2">Built for Scalability</h3>
          <p className="text-gray-300">
            Designed to evolve into enterprise-grade access automation & IoT integration.
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="text-center pb-6 text-gray-400 text-sm">
        © {new Date().getFullYear()} LocksAll — Prototype Preview
      </footer>
    </main>
  );
}
