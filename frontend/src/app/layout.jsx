import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LedgerFlow",
  description: "AI-powered invoicing and financial management",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("lf-theme")?.value || "dark";
  const savedAccent = cookieStore.get("lf-accent")?.value || "#22D3C5";
  const htmlClass = savedTheme === "light" ? "light" : "dark";

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('lf-theme') || '${savedTheme}';
                  var accent = localStorage.getItem('lf-accent') || '${savedAccent}';
                  var root = document.documentElement;
                  root.classList.remove('dark', 'light');
                  if (theme === 'system') {
                    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.add(systemDark ? 'dark' : 'light');
                  } else {
                    root.classList.add(theme);
                  }
                  var hex = accent.replace('#', '');
                  var r = parseInt(hex.substring(0,2), 16);
                  var g = parseInt(hex.substring(2,4), 16);
                  var b = parseInt(hex.substring(4,6), 16);
                  if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                    root.style.setProperty('--color-primary', r + ' ' + g + ' ' + b);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}