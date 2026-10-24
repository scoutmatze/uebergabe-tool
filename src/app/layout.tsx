import type { Metadata } from "next";
import { PT_Sans_Narrow } from "next/font/google";
import "./globals.css";

const ptSansNarrow = PT_Sans_Narrow({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pt-sans-narrow",
});

export const metadata: Metadata = {
  title: "DPSG Übergabe",
  description: "Amtsübergabe per Sprachnachricht – strukturiert, durchsuchbar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={ptSansNarrow.variable}>
      <body>{children}</body>
    </html>
  );
}
