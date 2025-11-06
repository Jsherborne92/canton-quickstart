import { useState, useEffect } from 'react';
import type { OrderInfo } from '../../services/order-book-client';
import { OrderBookClient } from '../../services/order-book-client';
import './OrderBook.css';

interface OrderBookProps {
  readonly client: OrderBookClient;
  readonly baseSymbol: string;
  readonly quoteSymbol: string;
}

export const OrderBook = ({
  client,
  baseSymbol,
  quoteSymbol,
}: OrderBookProps) => {
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async (): Promise<void> => {
      try {
        setError(null);
        const data = await client.getOrderBook(baseSymbol, quoteSymbol);
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
    // Refresh order book every 2 seconds
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, [client, baseSymbol, quoteSymbol]);

  if (loading) {
    return <div className="order-book-loading">Loading order book...</div>;
  }

  if (error) {
    return <div className="order-book-error">Error: {error}</div>;
  }

  const buyOrders = orders
    .filter((o) => o.orderType === 'buy')
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

  const sellOrders = orders
    .filter((o) => o.orderType === 'sell')
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

  const spread =
    sellOrders.length > 0 && buyOrders.length > 0
      ? parseFloat(sellOrders[0].price) - parseFloat(buyOrders[0].price)
      : null;

  return (
    <div className="order-book">
      <div className="order-book-header">
        <h2>
          {baseSymbol}/{quoteSymbol}
        </h2>
        {spread !== null && (
          <div className="spread-badge">
            Spread: ${spread.toFixed(2)}
          </div>
        )}
      </div>

      <div className="orders-container">
        {/* Sell Orders (Asks) */}
        <div className="sell-orders-section">
          <h3 className="section-title">Sell Orders (Asks)</h3>
          <div className="orders-table">
            <div className="table-header">
              <span>Price ({quoteSymbol})</span>
              <span>Quantity ({baseSymbol})</span>
              <span>Total ({quoteSymbol})</span>
            </div>
            {sellOrders.length === 0 ? (
              <div className="empty-orders">No sell orders</div>
            ) : (
              sellOrders.map((order) => (
                <div key={order.contractId} className="order-row sell">
                  <span className="price">${parseFloat(order.price).toFixed(2)}</span>
                  <span className="quantity">{parseFloat(order.quantity).toFixed(8)}</span>
                  <span className="total">
                    ${(parseFloat(order.price) * parseFloat(order.quantity)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Buy Orders (Bids) */}
        <div className="buy-orders-section">
          <h3 className="section-title">Buy Orders (Bids)</h3>
          <div className="orders-table">
            <div className="table-header">
              <span>Price ({quoteSymbol})</span>
              <span>Quantity ({baseSymbol})</span>
              <span>Total ({quoteSymbol})</span>
            </div>
            {buyOrders.length === 0 ? (
              <div className="empty-orders">No buy orders</div>
            ) : (
              buyOrders.map((order) => (
                <div key={order.contractId} className="order-row buy">
                  <span className="price">${parseFloat(order.price).toFixed(2)}</span>
                  <span className="quantity">{parseFloat(order.quantity).toFixed(8)}</span>
                  <span className="total">
                    ${(parseFloat(order.price) * parseFloat(order.quantity)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
