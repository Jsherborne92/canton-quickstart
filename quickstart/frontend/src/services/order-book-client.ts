// Order Book DEX Client
// Handles communication with the backend API for order book operations

export interface TokenInfo {
  readonly issuer: string;
  readonly owner: string;
  readonly symbol: string;
  readonly amount: string;
  readonly contractId: string;
}

export interface OrderInfo {
  readonly exchange: string;
  readonly trader: string;
  readonly baseSymbol: string;
  readonly quoteSymbol: string;
  readonly price: string;
  readonly quantity: string;
  readonly collateralCid: string;
  readonly contractId: string;
  readonly orderType: 'buy' | 'sell';
}

export interface PlaceOrderRequest {
  readonly orderType: 'buy' | 'sell';
  readonly baseSymbol: string;
  readonly quoteSymbol: string;
  readonly price: string;
  readonly quantity: string;
  readonly collateralCid: string;
}

export class OrderBookClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthToken: () => string
  ) {}

  async getTokens(): Promise<TokenInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/orderbook/tokens`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }

    return response.json();
  }

  async getOrderBook(
    baseSymbol: string,
    quoteSymbol: string
  ): Promise<OrderInfo[]> {
    const url = new URL(`${this.baseUrl}/api/orderbook/orders`);
    url.searchParams.set('baseSymbol', baseSymbol);
    url.searchParams.set('quoteSymbol', quoteSymbol);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order book: ${response.statusText}`);
    }

    return response.json();
  }

  async placeOrder(request: PlaceOrderRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/orderbook/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to place order: ${response.statusText}`);
    }

    return response.json();
  }

  async checkHealth(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/orderbook/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.text();
  }
}
