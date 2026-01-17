import type { Metadata } from "next";
import "./globals.css";
import { PWAServiceWorkerRegister } from "@/components/pwa-service-worker";
import { GuestBootstrap } from "@/components/guest-bootstrap";
import { AnalyticsProvider } from "@/components/analytics-provider";

export const metadata: Metadata = {
  title: "LieSense",
  description: "Mobile-first quiz с тремя утверждениями: найди ложь, держи streak и зови друзей в дуэль.",
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWAServiceWorkerRegister />
        <GuestBootstrap />
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
