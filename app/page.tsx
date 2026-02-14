"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PrototypePanel from "@/components/PrototypePanel";

type SectionKey = "features" | "useCases" | "faq";
type MouseVector = { x: number; y: number };

/** Abstract animated security background */
function SecurityBackground({ mouse }: { mouse: MouseVector }) {
  const layerStyle = {
    transform: `translate3d(${mouse.x * 35}px, ${mouse.y * 25}px, 0)`,
  };

  const nodes = [
    { top: "14%", left: "18%" },
    { top: "22%", left: "42%" },
    { top: "16%", left: "72%" },
    { top: "33%", left: "60%" },
    { top: "38%", left: "25%" },
    { top: "48%", left: "45%" },
    { top: "52%", left: "78%" },
    { top: "62%", left: "18%" },
    { top: "66%", left: "55%" },
    { top: "74%", left: "35%" },
    { top: "78%", left: "82%" },
    { top: "86%", left: "58%" },
  ];

  return (
    <div className="la-bg">
      <div className="la-bg-grid" />
      <div className="la-bg-orb orb-1" />
      <div className="la-bg-orb orb-2" />
      <div className="la-bg-orb orb-3" />

      <div className="la-bg-network" style={layerStyle}>
        <div className="la-bg-lines line-a" />
        <div className="la-bg-lines line-b" />
        <div className="la-bg-lines line-c" />

        {nodes.map((n, i) => (
          <div key={i} className="la-bg-node2" style={{ top: n.top, left: n.left }}>
            <span className="la-bg-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUseCase, setActiveUseCase] = useState<SectionKey>("features");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [mouse, setMouse] = useState<MouseVector>({ x: 0, y: 0 });

  const featuresRef = useRef<HTMLElement | null>(null);
  const useCasesRef = useRef<HTMLElement | null>(null);
  const faqRef = useRef<HTMLElement | null>(null);

  const handleScrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / innerWidth;
    const y = (e.clientY - innerHeight / 2) / innerHeight;
    setMouse({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to subscribe");
      }

      setSubmitted(true);
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPrototype = () => {
    if (status === "authenticated") {
      document.getElementById("prototype")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/login?callbackUrl=/#prototype");
    }
  };

  const faqItems = [
    {
      q: "What is LocksAll?",
      a: "LocksAll is a unified security platform concept that connects digital identity with physical and digital access.",
    },
    {
      q: "Is this a live product?",
      a: "This is an early prototype and concept preview.",
    },
    {
      q: "Who is it for?",
      a: "Individuals and organizations who want centralized security control.",
    },
    {
      q: "How can I try it?",
      a: "Login and click Prototype to access the dashboard.",
    },
  ];

  return (
    <main className="la-page" onMouseMove={handleMouseMove}>
      <SecurityBackground mouse={mouse} />

      <div className="la-content">
        {/* NAVBAR */}
        <header className="la-nav">
          <div className="la-logo">
            Locks<span>All</span>
          </div>
          <nav className="la-nav-links">
            <button onClick={() => handleScrollTo(featuresRef)}>Features</button>
            <button onClick={() => handleScrollTo(useCasesRef)}>Use cases</button>
            <button onClick={() => handleScrollTo(faqRef)}>FAQ</button>

            <button onClick={goToPrototype}>Prototype</button>
          </nav>
        </header>

        {/* HERO */}
        <section className="la-hero">
          <div className="la-hero-inner">
            <h1>Secure access for financial safety.</h1>
            <p>
              Instantly block or unblock all linked cards from one place.
              Designed for emergency scenarios and fast response.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="la-footer-button" onClick={goToPrototype}>
                View Prototype
              </button>
            </div>

            {!submitted ? (
              <>
                <form className="la-cta-form" onSubmit={handleSubmit}>
                  <input
                    type="email"
                    required
                    placeholder="Your best email for early access"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Request Invite"}
                  </button>
                </form>
                {error && <p className="la-cta-error">{error}</p>}
              </>
            ) : (
              <p className="la-cta-thanks">🎉 Thanks! You’re on the early-access list.</p>
            )}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" ref={featuresRef} className="la-section">
          <h2>Why LocksAll?</h2>
          <p className="la-section-subtitle">A single control plane for access, logs, and automation.</p>
          {/* your existing features grid... */}
        </section>

        {/* USE CASES */}
        <section id="usecases" ref={useCasesRef} className="la-section">
          <h2>Made for real-world scenarios</h2>
          {/* your existing tabs... */}
        </section>

        {/* FAQ */}
        <section id="faq" ref={faqRef} className="la-section la-faq-section">
          <h2>Questions, meet answers.</h2>
          {/* your existing faq accordion... */}
        </section>

        {/* 🔐 Prototype (only renders if authenticated) */}
        <PrototypePanel />

        {/* FOOTER ... keep yours as-is */}
      </div>
    </main>
  );
}
