import { TRUNCATE_END, TRUNCATE_START } from "@/wagmiConfig/constants";

export const getBaseUrl = () => {
  return typeof window !== "undefined" ? window.location.origin : "";
};

export const baseUrl = getBaseUrl();

export const truncateAddress = (
  address: string,
  start = TRUNCATE_START,
  end = TRUNCATE_END
) => `${address.slice(0, start)}…${address.slice(-end)}`;
