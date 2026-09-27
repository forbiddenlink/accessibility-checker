import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contrast Checker Preview",
  description:
    "A static preview of the color contrast checker, used for marketing screenshots.",
};

export default function ScreenshotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
