// Copyright (c) 2025, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: 0BSD

/**
 * Wrapper component for the DEX view that integrates with the existing app structure.
 * This component handles authentication token retrieval and client initialization.
 */

import { DexView } from './DexView';
import { OrderBookClient } from '../services/order-book-client';
import { useEffect, useState } from 'react';

const DexViewWrapper = () => {
  const [client, setClient] = useState<OrderBookClient | null>(null);

  useEffect(() => {
    // Get the auth token from localStorage or session
    // This matches the existing authentication pattern in the quickstart
    const getAuthToken = () => {
      return localStorage.getItem('authToken') ||
             sessionStorage.getItem('authToken') ||
             '';
    };

    // Initialize the OrderBook client
    const orderBookClient = new OrderBookClient(
      window.location.origin, // Use same origin for API calls
      getAuthToken
    );

    setClient(orderBookClient);
  }, []);

  if (!client) {
    return <div className="loading">Initializing DEX...</div>;
  }

  return <DexView client={client} />;
};

export default DexViewWrapper;
