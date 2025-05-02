import type { TokenId } from "@/wagmiConfig/constants"

export interface Token {
  id: TokenId
  name: string
  symbol: string
  decimals: number
  address?: string
  iconName?: string
} 