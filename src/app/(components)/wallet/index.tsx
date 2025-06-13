"use client";

import { Button } from "@/components/button";
import { Dropdown } from "@/components/dropdown";
import { truncateAddress } from "@/lib/utils";
import { toast } from "sonner";
import s from "./wallet.module.scss";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { useEffect, useState, useRef } from "react";
import { useStore } from "../../../store/onboardingStore";

export const Wallet = () => {
  const { open: openLoginModal, close: closeLoginModal } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isLoading, step } = useStore();
  const hasLoggedIn = useRef(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const connectionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionStateRef = useRef(false);

  useEffect(() => {
    // Mark that the component has mounted
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 2000); // Give 2 seconds after mount before allowing notifications

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Clear any existing debounce timer
    if (connectionDebounceRef.current) {
      clearTimeout(connectionDebounceRef.current);
    }

    // Only process if connection state actually changed
    if (lastConnectionStateRef.current === isConnected) {
      return;
    }

    lastConnectionStateRef.current = isConnected;

    // Debounce the connection check to prevent rapid state changes
    connectionDebounceRef.current = setTimeout(() => {
      // Only show "Logged in" notification if:
      // 1. Wallet is connected
      // 2. Haven't shown notification before
      // 3. Not on initial mount (prevents showing during app startup)
      // 4. Not during global loading (prevents showing during dashboard loading)
      // 5. User is past the connection step (step > 0)
      // 6. This is actually a new connection (not just a state refresh)
      if (
        isConnected && 
        !hasLoggedIn.current && 
        !isInitialMount && 
        !isLoading && 
        step > 0
      ) {
        // Additional check: only show if we have an address and it's a stable connection
        if (address && address.length > 0) {
          toast.success("Logged in");
          console.log("Logged in");
          hasLoggedIn.current = true;
        }
      }

      // Reset the flag when disconnected
      if (!isConnected) {
        hasLoggedIn.current = false;
      }
    }, 500); // 500ms debounce

    // Cleanup function
    return () => {
      if (connectionDebounceRef.current) {
        clearTimeout(connectionDebounceRef.current);
      }
    };
  }, [isConnected, isInitialMount, isLoading, step, address]);

  const handleConnect = async () => {
    await openLoginModal();
  };

  const handleLogout = async () => {
    await closeLoginModal();
    disconnect();
    toast.success("Logged out");
  };

  if (!address) {
    return (
      <Button
        iconRight="hugeicons:wallet-01"
        className={s.button}
        onClick={handleConnect}
      >
        <span>Connect Wallet</span>
      </Button>
    );
  }

  return (
    <Dropdown
      opener={
        <Button
          iconRight="hugeicons:more-vertical-circle-01"
          className={s.button}
        >
          <span>{truncateAddress(address)}</span>
        </Button>
      }
      position="bottom-right"
    >
      <ul>
        {/* <li>
          <Button iconLeft="hugeicons:user" isNav={true}>
            Account
          </Button>
        </li>
        <li>
          <Button iconLeft="hugeicons:settings-02" isNav={true}>
            Settings
          </Button>
        </li> */}
        <li>
          <Button
            iconLeft="hugeicons:logout-03"
            isNav={true}
            onClick={handleLogout}
            variant="danger"
          >
            Logout
          </Button>
        </li>
      </ul>
    </Dropdown>
  );
};
