const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export type BridgeAsset = {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: string;
};

export async function getAssets(chainId: number): Promise<{ success: boolean; chainId: number; hyperionContract: string; assets: BridgeAsset[] }> {
  const res = await fetch(`${API_URL}/bridge/assets?chainId=${chainId}`);
  if (!res.ok) throw new Error('Failed to fetch bridge assets');
  return res.json();
}

export type PreparedStep = {
  type: 'wrap' | 'approve' | 'send';
  to: string;
  tx: any; // ethers populated tx object
};

export async function prepareBridge(body: { chainId: number; tokenSymbol: string; amount: string; destination: string; data?: string }) {
  const res = await fetch(`${API_URL}/bridge/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Failed to prepare bridge');
  }
  return res.json() as Promise<{ success: true; chainId: number; token: string; steps: PreparedStep[] }>;
}

export async function checkStatus(body: { chainId: number; tokenSymbol: string; sender: string; amount: string; destination?: string; depositId?: string }) {
  const res = await fetch(`${API_URL}/bridge/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to check bridge status');
  return res.json() as Promise<{ success: boolean; found: boolean; deposit?: any }>;
}


