import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <main className="la-page">
      <div className="la-content" style={{ paddingTop: 48, maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>Loading...</h1>
        <p style={{ opacity: 0.75, marginTop: 0 }}>Preparing password reset.</p>
      </div>
    </main>
  );
}
