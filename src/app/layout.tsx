import "@/styles/globals.scss";
import { headers } from "next/headers";
import { WagmiProvider } from "wagmi";
import { config } from "../wagmiConfig/config";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ContextProvider from "@/context";
import LayoutClientWrapper from "@/components/LayoutClientWrapper"; // create this component

export const queryClient = new QueryClient();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const cookies = (await headersList).get("cookie") || "";

  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </ContextProvider>
      </body>
    </html>
  );
}
