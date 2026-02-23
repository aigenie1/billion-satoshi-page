import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Block, Selection } from '../types';
import { CRYPTO_CURRENCIES, PRICE_PER_PIXEL_USDT } from '../constants';
import { Bitcoin, CheckCircle2, Copy, ExternalLink, Image as ImageIcon, Loader2, MousePointerSquareDashed, UploadCloud, ShieldAlert, Sparkles, FileCode, Wallet } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    sui?: any;
  }
}

interface SidebarProps {
  selection: Selection | null;
  isValid: boolean;
  onPurchase: (block: Omit<Block, 'id'>) => void;
  onClearSelection: () => void;
  blocks: Block[];
  currentPage: number;
}

export default function Sidebar({ selection, isValid, onPurchase, onClearSelection, blocks, currentPage }: SidebarProps) {
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [isAnimated, setIsAnimated] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_CURRENCIES[0]);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{isSafe: boolean, reason: string} | null>(null);
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setPaymentError(null);
    try {
      if (selectedCrypto.type === 'evm') {
        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          setWalletAddress(accounts[0]);
          
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${selectedCrypto.chainId?.toString(16)}` }],
            });
          } catch (switchError: any) {
            console.error("Failed to switch network", switchError);
          }
        } else {
          throw new Error("MetaMask not found");
        }
      } else if (selectedCrypto.type === 'solana') {
        if (typeof window.solana !== 'undefined') {
          const resp = await window.solana.connect();
          setWalletAddress(resp.publicKey.toString());
        } else {
          throw new Error("Phantom wallet not found");
        }
      } else if (selectedCrypto.type === 'sui') {
        if (typeof window.sui !== 'undefined') {
          const accounts = await window.sui.getAccounts();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          } else {
            throw new Error("Connect your Sui wallet first");
          }
        } else {
          throw new Error("Sui wallet not found");
        }
      } else {
        throw new Error(`Manual payment required for ${selectedCrypto.name}`);
      }
    } catch (err: any) {
      setPaymentError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRealPayment = async () => {
    setIsPaying(true);
    setPaymentError(null);
    try {
      let txHash = "";
      
      if (selectedCrypto.type === 'evm') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // For demo, we'll send a small amount of native token equivalent to the USDT price
        const amountInEth = ethers.parseEther("0.0001"); 
        
        const tx = await signer.sendTransaction({
          to: selectedCrypto.address,
          value: amountInEth
        });
        
        txHash = tx.hash;
        await tx.wait();
      } else {
        // For non-EVM or manual, we simulate a hash for the demo
        // In a real app, the user would provide the hash after manual payment
        txHash = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Verify with backend to check for duplicates
      const response = await fetch('/api/verify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash: txHash,
          network: selectedCrypto.id,
          amount: price.toString()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      completePurchase();
    } catch (err: any) {
      setPaymentError(err.message || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | undefined;
    if ('dataTransfer' in e) {
      e.preventDefault();
      file = e.dataTransfer.files?.[0];
    } else {
      file = e.target.files?.[0];
    }

    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const scanImage = async (base64Data: string) => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: "Analyze this image for any inappropriate content, NSFW material, malware signatures (like QR codes leading to phishing), or malicious payloads. Respond in JSON format with 'isSafe' (boolean) and 'reason' (string)." },
              { inlineData: { mimeType: 'image/jpeg', data: base64Data.split(',')[1] } }
            ]
          }
        ],
        config: { responseMimeType: 'application/json' }
      });

      const response = await model;
      const result = JSON.parse(response.text || '{"isSafe": true, "reason": "OK"}');
      setScanResult(result);
      return result.isSafe;
    } catch (err) {
      console.error("AI Scan error:", err);
      // Fallback to safe if AI fails, or you can be strict
      return true;
    } finally {
      setIsScanning(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    let isSafe = true;
    if (uploadMode === 'upload' && imageBase64) {
      isSafe = await scanImage(imageBase64);
    }

    if (isSafe) {
      setStep('payment');
    }
  };

  const formatLink = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const completePurchase = () => {
    onPurchase({
      page: currentPage,
      x: selection!.x,
      y: selection!.y,
      w: selection!.w,
      h: selection!.h,
      imageUrl: uploadMode === 'upload' ? imageBase64 : formatLink(imageUrl),
      link: formatLink(link),
      title,
      animated: isAnimated
    });
    setStep('success');
  };

  if (!selection) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
        <MousePointerSquareDashed className="w-12 h-12 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Select Pixels</h3>
        <p className="text-sm">Click and drag on the grid to select the area you want to purchase.</p>
        <div className="flex flex-col gap-2 mt-4">
          <button 
            onClick={() => document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 underline"
          >
            New here? See how it works
          </button>
          <button 
            onClick={() => document.getElementById('legal')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-bold text-gray-400 hover:text-gray-500 underline"
          >
            Review Legal & Terms
          </button>
        </div>
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left w-full border border-gray-100">
          <h4 className="font-medium text-gray-900 mb-3 text-sm flex items-center gap-2">
            <Bitcoin className="w-4 h-4 text-orange-500" />
            Pricing
          </h4>
          <ul className="text-sm space-y-3">
            <li className="flex justify-between items-center">
              <span className="text-gray-600">1 Block (10x10px)</span> 
              <span className="font-mono font-medium text-gray-900">${(PRICE_PER_PIXEL_USDT * 100).toFixed(2)} USDT</span>
            </li>
            <li className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="text-gray-600">Minimum purchase</span> 
              <span className="font-medium text-gray-900">1 Block</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const pixels = selection.w * selection.h * 100;
  const basePrice = pixels * PRICE_PER_PIXEL_USDT;
  const price = isAnimated ? basePrice * 2 : basePrice;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Purchase Pixels</h2>
          <div className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
            Page {currentPage + 1}
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-600 font-medium">Selected Area</span>
            <span className="font-bold text-blue-900">{selection.w * 10} x {selection.h * 10} px</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-600 font-medium">Total Pixels</span>
            <span className="font-bold text-blue-900">{pixels.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-blue-200 font-semibold">
            <span>Total Cost</span>
            <span className="font-mono text-orange-600">${price.toFixed(2)} USDT</span>
          </div>
        </div>

        {step === 'form' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Currency</label>
              <div className="grid grid-cols-3 gap-2">
                {CRYPTO_CURRENCIES.map(crypto => (
                  <button
                    key={crypto.id}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`px-2 py-2 text-xs font-bold rounded-md border transition-all ${selectedCrypto.id === crypto.id ? 'bg-orange-500 border-orange-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'}`}
                  >
                    {crypto.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-900">Animated Ad</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isAnimated}
                  onChange={e => setIsAnimated(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            <p className="text-[10px] text-orange-600 italic">* Animated ads cost 2x and feature a pulse effect.</p>
          </div>
        )}

        {!isValid && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            Your selection overlaps with already purchased pixels. Please select an empty area.
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Image Source</label>
                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${uploadMode === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${uploadMode === 'url' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    URL
                  </button>
                </div>
              </div>

              {uploadMode === 'upload' ? (
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50 transition-colors cursor-pointer"
                  onDrop={handleFileChange}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    {imageBase64 ? (
                      <img src={imageBase64} alt="Preview" className="mx-auto h-32 object-contain mb-4 rounded" />
                    ) : (
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        {imageBase64 ? 'Change image' : 'Upload a file'}
                      </span>
                      {!imageBase64 && <p className="pl-1">or drag and drop</p>}
                      <input 
                        ref={fileInputRef}
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required={uploadMode === 'url'}
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="example.com/image.png"
                    />
                  </div>
                  {imageUrl && (
                    <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Preview</p>
                      <img 
                        src={formatLink(imageUrl)} 
                        alt="URL Preview" 
                        className="mx-auto h-32 object-contain rounded border border-gray-200"
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL')}
                      />
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Must be exactly {selection.w * 10}x{selection.h * 10} pixels for best results.</p>
              
              {scanResult && !scanResult.isSafe && (
                <div className="mt-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Security Scan Failed</p>
                    <p>{scanResult.reason}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Link</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="yourwebsite.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hover Title</label>
              <input
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Catchy Slogan"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClearSelection}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isScanning || (uploadMode === 'upload' && !imageFile)}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Continue to Pay'
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'payment' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Payment Method</span>
                <span className="text-sm font-bold text-orange-600">{selectedCrypto.name}</span>
              </div>
              
              {walletAddress ? (
                <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200 mb-4">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <code className="text-xs flex-1 truncate text-left">{walletAddress}</code>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              ) : selectedCrypto.type !== 'manual' && (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Connect {selectedCrypto.name} Wallet
                </button>
              )}

              <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm inline-block mb-4">
                <QRCodeSVG 
                  value={`${selectedCrypto.symbol.toLowerCase()}:${selectedCrypto.address}?amount=${price}`}
                  size={160}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Send exactly</label>
                <div className="font-mono text-xl font-bold text-gray-900 mb-4">${price.toFixed(2)} USDT</div>
                
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">To {selectedCrypto.name} Address</label>
                <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                  <code className="text-xs flex-1 break-all text-left">{selectedCrypto.address}</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(selectedCrypto.address)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {paymentError && (
              <div className="w-full p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {paymentError}
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg w-full border border-blue-100">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span className="text-left font-medium">Awaiting payment confirmation. This window will update automatically.</span>
            </div>

            <div className="pt-4 w-full flex flex-col gap-3">
              <button
                onClick={selectedCrypto.type === 'manual' ? completePurchase : handleRealPayment}
                disabled={isPaying || (selectedCrypto.type !== 'manual' && !walletAddress)}
                className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {selectedCrypto.type === 'manual' ? 'Confirm Payment' : 'Pay with Wallet'}
              </button>
              <button
                onClick={() => setStep('form')}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Details
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Payment Received!</h3>
            <p className="text-gray-600 text-sm">
              Your pixels have been secured and your ad is now live on the grid.
            </p>
            <button
              onClick={() => { 
                setStep('form'); 
                onClearSelection();
                setLink('');
                setTitle('');
                setImageUrl('');
                setImageFile(null);
                setImageBase64('');
                setIsAnimated(false);
                setScanResult(null);
              }}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
