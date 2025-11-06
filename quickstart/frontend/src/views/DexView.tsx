import { useState, useEffect } from 'react';
import { OrderBook } from '../components/orderbook/OrderBook';
import { PlaceOrderForm } from '../components/orderbook/PlaceOrderForm';
import { OrderBookClient, TokenInfo } from '../services/order-book-client';
import './DexView.css';

interface DexViewProps {
  readonly client: OrderBookClient;
}

export const DexView = ({ client }: DexViewProps) => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState({ base: 'BTC', quote: 'USD' });

  const loadTokens = async (): Promise<void> => {
    try {
      setError(null);
      const data = await client.getTokens();
      setTokens(data);
    } catch (err) {
      console.error('Failed to load tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const handleOrderPlaced = () => {
    // Refresh tokens after placing an order
    loadTokens();
  };

  if (loading) {
    return <div className="dex-loading">Loading DEX...</div>;
  }

  return (
    <div className="dex-view">
      <header className="dex-header">
        <h1>Canton DEX</h1>
        <p className="subtitle">Decentralized Order Book Exchange</p>
      </header>

      {error && <div className="dex-error">{error}</div>}

      <section className="wallet-section">
        <h2>My Wallet</h2>
        {tokens.length === 0 ? (
          <div className="empty-wallet">
            <p>No tokens found</p>
            <p className="help-text">
              You need tokens to start trading. Contact your administrator to mint tokens.
            </p>
          </div>
        ) : (
          <div className="tokens-grid">
            {tokens.map((token) => (
              <div key={token.contractId} className="token-card">
                <div className="token-symbol">{token.symbol}</div>
                <div className="token-amount">{parseFloat(token.amount).toFixed(8)}</div>
                <div className="token-issuer">Issued by: {token.issuer.slice(0, 8)}...</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="trading-section">
        <div className="trading-pair-selector">
          <h2>Trading Pair</h2>
          <div className="pair-selector">
            <select
              value={selectedPair.base}
              onChange={(e) => setSelectedPair({ ...selectedPair, base: e.target.value })}
            >
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
            </select>
            <span className="separator">/</span>
            <select
              value={selectedPair.quote}
              onChange={(e) => setSelectedPair({ ...selectedPair, quote: e.target.value })}
            >
              <option value="USD">USD</option>
              <option value="USDC">USDC</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div className="trading-grid">
          <div className="order-book-container">
            <OrderBook
              client={client}
              baseSymbol={selectedPair.base}
              quoteSymbol={selectedPair.quote}
            />
          </div>

          <div className="order-form-container">
            <PlaceOrderForm
              client={client}
              tokens={tokens}
              baseSymbol={selectedPair.base}
              quoteSymbol={selectedPair.quote}
              onOrderPlaced={handleOrderPlaced}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
