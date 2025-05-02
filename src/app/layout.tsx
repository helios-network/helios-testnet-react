import "@/styles/globals.scss";
import ContextProvider from "@/context";
import LayoutClientWrapper from "@/components/LayoutClientWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* In static export mode, cookies will be null */}
        <ContextProvider cookies={null}>
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </ContextProvider>
      </body>
    </html>
  );
}
