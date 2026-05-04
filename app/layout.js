import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/app/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tutorite - One-to-One Tutoring Platform",
  description: "Connect with qualified tutors for personalized one-on-one sessions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
