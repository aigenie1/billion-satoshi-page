export const GRID_SIZE = 316; // 316x316 blocks = ~100,000 blocks = 10,000,000 pixels
export const BLOCK_SIZE = 10; // 10x10 pixels per block
export const CANVAS_SIZE = GRID_SIZE * BLOCK_SIZE; // 3160 pixels
export const TOTAL_PAGES = 100; // 100 pages * 10M pixels = 1 Billion Pixels

export const PRICE_PER_PIXEL_USDT = 0.01; // $0.01 per pixel

export const CRYPTO_CURRENCIES = [
  { 
    id: 'BTC', 
    name: 'Bitcoin', 
    address: 'bc1qqqhudauewr2jypz5vrlx6x94mq0gwat30qx977', 
    symbol: 'BTC',
    type: 'manual'
  },
  { 
    id: 'ETH', 
    name: 'Ethereum', 
    address: '0xDDAF309db9824302f29B11B1c4e8172Bd40DaD5F', 
    symbol: 'ETH',
    type: 'evm',
    chainId: 1
  },
  { 
    id: 'BASE', 
    name: 'Base', 
    address: '0xDDAF309db9824302f29B11B1c4e8172Bd40DaD5F', 
    symbol: 'ETH',
    type: 'evm',
    chainId: 8453
  },
  { 
    id: 'POLYGON', 
    name: 'Polygon', 
    address: '0xDDAF309db9824302f29B11B1c4e8172Bd40DaD5F', 
    symbol: 'POL',
    type: 'evm',
    chainId: 137
  },
  { 
    id: 'SOL', 
    name: 'Solana', 
    address: '5ANdHgVSz75xT7u4qsHWqYq9ubnraJsizUzVf1msTKQM', 
    symbol: 'SOL',
    type: 'solana'
  },
  { 
    id: 'SUI', 
    name: 'Sui', 
    address: '0x2363331640bd29e438fe2e953dd7b60f82f3dbbba5f76342e3a6307a55e364ec', 
    symbol: 'SUI',
    type: 'sui'
  }
];
