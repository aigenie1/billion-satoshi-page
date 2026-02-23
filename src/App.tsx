/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PixelGrid from './components/PixelGrid';
import Sidebar from './components/Sidebar';
import HowItWorks from './components/HowItWorks';
import Legal from './components/Legal';
import { Block, Selection } from './types';
import { GRID_SIZE } from './constants';
import { Bitcoin, Info } from 'lucide-react';

const INITIAL_BLOCKS: Block[] = [
  {
    id: '1',
    page: 0,
    x: 10,
    y: 10,
    w: 20,
    h: 10,
    imageUrl: 'https://picsum.photos/seed/crypto/200/100',
    link: 'https://bitcoin.org',
    title: 'Bitcoin - A Peer-to-Peer Electronic Cash System',
    animated: true
  },
  {
    id: '2',
    page: 0,
    x: 40,
    y: 50,
    w: 10,
    h: 10,
    imageUrl: 'https://picsum.photos/seed/eth/100/100',
    link: 'https://ethereum.org',
    title: 'Ethereum - Decentralized Applications'
  },
  {
    id: '3',
    page: 1,
    x: 80,
    y: 20,
    w: 15,
    h: 15,
    imageUrl: 'https://picsum.photos/seed/ai/150/150',
    link: 'https://google.com',
    title: 'AI Revolution'
  }
];

export default function App() {
  const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);
  const [currentPage, setCurrentPage] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<Block | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);

  const isSelectionValid = (sel: Selection) => {
    const pageBlocks = blocks.filter(b => b.page === currentPage);
    return !pageBlocks.some(block => {
      // Check if selection rectangle intersects with block rectangle
      return !(
        block.x >= sel.x + sel.w ||
        block.x + block.w <= sel.x ||
        block.y >= sel.y + sel.h ||
        block.y + block.h <= sel.y
      );
    });
  };

  const handlePurchase = (newBlock: Omit<Block, 'id'>) => {
    const block: Block = {
      ...newBlock,
      id: Math.random().toString(36).substr(2, 9)
    };
    setBlocks([...blocks, block]);
    setSelection(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const totalPixelsSold = blocks.reduce((acc, b) => acc + (b.w * b.h * 100), 0);
  const totalPixels = GRID_SIZE * GRID_SIZE * 100 * 100; // 100 pages
  const percentageSold = (totalPixelsSold / totalPixels) * 100;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Pixel Crypto Ads</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-4 ml-4">
              <button 
                onClick={() => document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors"
              >
                How it Works
              </button>
              <button 
                onClick={() => document.getElementById('legal')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors"
              >
                Legal
              </button>
            </nav>

            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-2 py-1 text-xs font-bold disabled:opacity-30"
              >
                &larr;
              </button>
              <select 
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="bg-transparent text-xs font-bold focus:outline-none"
              >
                {Array.from({ length: 100 }).map((_, i) => (
                  <option key={i} value={i}>Page {i + 1}</option>
                ))}
              </select>
              <button 
                onClick={() => setCurrentPage(Math.min(99, currentPage + 1))}
                disabled={currentPage === 99}
                className="px-2 py-1 text-xs font-bold disabled:opacity-30"
              >
                &rarr;
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-gray-500 font-medium">Total Pixels Sold</span>
              <span className="font-bold text-gray-900">{totalPixelsSold.toLocaleString()} / 1B</span>
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden hidden md:block">
              <div 
                className="h-full bg-orange-500 rounded-full" 
                style={{ width: `${percentageSold}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Grid Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
            <Info className="w-4 h-4 shrink-0" />
            <p>1 Billion pixels available across 100 pages. 1 pixel starts at $0.01 USDT. Animated ads available!</p>
          </div>
          
          <PixelGrid 
            blocks={blocks}
            selection={selection}
            onSelectionChange={setSelection}
            onHoverBlock={setHoveredBlock}
            currentPage={currentPage}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <Sidebar 
              selection={selection}
              isValid={selection ? isSelectionValid(selection) : false}
              onPurchase={handlePurchase}
              onClearSelection={() => setSelection(null)}
              blocks={blocks}
              currentPage={currentPage}
            />
          </div>
        </div>
      </main>

      <HowItWorks />
      <Legal />

      {/* Tooltip */}
      {hoveredBlock && mousePos && (
        <div 
          className="fixed pointer-events-none z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-md shadow-xl max-w-xs break-words"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y + 15,
            transform: 'translate(0, 0)'
          }}
        >
          <div className="font-medium mb-1">{hoveredBlock.title}</div>
          <div className="text-gray-400 text-xs truncate">{hoveredBlock.link}</div>
        </div>
      )}
    </div>
  );
}
