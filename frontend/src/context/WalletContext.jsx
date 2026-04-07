import { createContext, useContext, useState } from 'react';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [publicKey, setPublicKey] = useState(localStorage.getItem('edu_pubkey') || null);
  const [role, setRole] = useState(localStorage.getItem('edu_role') || 'student');

  async function connect() {
    try {
      // Try Freighter
      const { getPublicKey, isConnected } = await import('@stellar/freighter-api');
      if (await isConnected()) {
        const pk = await getPublicKey();
        setPublicKey(pk);
        localStorage.setItem('edu_pubkey', pk);
        return pk;
      }
    } catch {
      // Freighter not available — use mock for dev
      const mock = 'GABC123DEVMOCKPUBLICKEY';
      setPublicKey(mock);
      localStorage.setItem('edu_pubkey', mock);
      return mock;
    }
  }

  function disconnect() {
    setPublicKey(null);
    localStorage.removeItem('edu_pubkey');
    localStorage.removeItem('edu_token');
  }

  return (
    <WalletContext.Provider value={{ publicKey, role, setRole, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
