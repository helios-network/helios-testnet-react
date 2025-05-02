import type { ChainId } from "@/wagmiConfig/constants"
import type { Token } from "@/types/Tokens"

export interface Chain {
  id: ChainId
  chainNb: number
  name: string
  color: string
  iconName: string
}

export interface ChainWithTokens extends Chain {
  tokens: Token[]
}
