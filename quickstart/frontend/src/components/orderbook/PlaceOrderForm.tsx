import { useState } from 'react';
import type { OrderBookClient, TokenInfo } from '../../services/order-book-client';
import './PlaceOrderForm.css';

interface PlaceOrderFormProps {
  readonly client: OrderBookClient;
  readonly tokens: TokenInfo[];
  readonly baseSymbol: string;
  readonly quoteSymbol: string;
  readonly onOrderPlaced: () => void;
}

export const PlaceOrderForm = ({
  client,
  tokens,
  baseSymbol,
  quoteSymbol,
  onOrderPlaced,
}: PlaceOrderFormProps) => {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filter tokens based on order type
  const availableTokens = tokens.filter((t) =>
    orderType === 'buy' ? t.symbol === quoteSymbol : t.symbol === baseSymbol
  );

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await client.placeOrder({
        orderType,
        baseSymbol,
        quoteSymbol,
        price,
        quantity,
        collateralCid: selectedToken,
      });

      // Reset form
      setPrice('');
      setQuantity('');
      setSelectedToken('');
      setSuccess(true);
      onOrderPlaced();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to place order:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const total = price && quantity ? (parseFloat(price) * parseFloat(quantity)).toFixed(2) : '0.00';
  const isFormValid = price && quantity && selectedToken && parseFloat(price) > 0 && parseFloat(quantity) > 0;

  return (
    <div className="place-order-form">
      <h3>Place Order</h3>

      <div className="order-type-selector">
        <button
          type="button"
          className={`order-type-btn ${orderType === 'buy' ? 'active buy' : ''}`}
          onClick={() => {
            setOrderType('buy');
            setSelectedToken('');
          }}
        >
          Buy
        </button>
        <button
          type="button"
          className={`order-type-btn ${orderType === 'sell' ? 'active sell' : ''}`}
          onClick={() => {
            setOrderType('sell');
            setSelectedToken('');
          }}
        >
          Sell
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Order placed successfully!</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="price">Price ({quoteSymbol})</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity ({baseSymbol})</label>
          <input
            id="quantity"
            type="number"
            step="0.00000001"
            min="0.00000001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00000000"
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="collateral">Collateral Token</label>
          <select
            id="collateral"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            required
            disabled={submitting}
          >
            <option value="">Select token...</option>
            {availableTokens.map((token) => (
              <option key={token.contractId} value={token.contractId}>
                {token.symbol}: {parseFloat(token.amount).toFixed(8)}
              </option>
            ))}
          </select>
          {availableTokens.length === 0 && (
            <p className="help-text">
              No {orderType === 'buy' ? quoteSymbol : baseSymbol} tokens available
            </p>
          )}
        </div>

        <div className="order-summary">
          <div className="summary-row">
            <span>Total:</span>
            <span className="total-value">{total} {quoteSymbol}</span>
          </div>
        </div>

        <button
          type="submit"
          className={`submit-btn ${orderType}`}
          disabled={submitting || !isFormValid}
        >
          {submitting ? 'Placing Order...' : `Place ${orderType.toUpperCase()} Order`}
        </button>
      </form>
    </div>
  );
};
