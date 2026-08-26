import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tempora",
  description: "Running training plan and coach",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
