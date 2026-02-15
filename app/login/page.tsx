import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <main className="la-page">
      <div className="la-content" style={{ paddingTop: 48, maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>Loading...</h1>
        <p style={{ opacity: 0.75, marginTop: 0 }}>
          Preparing secure login.
        </p>
      </div>
    </main>
  );
}
