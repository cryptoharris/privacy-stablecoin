/* global BigInt */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// Import ethers functions
import { BrowserProvider, Contract, formatUnits, parseUnits, solidityPackedKeccak256, randomBytes, hexlify, isAddress, isHexString, MaxUint256, getAddress } from 'ethers';

// Import ABIs
import TSSABI from './TSSABI.json';
import PrivacyPoolABI from './PrivacyPoolABI.json';
import './App.css';

// --- CONFIGURATION ---

// Deployed Contract Addresses on Arbitrum Sepolia
const tssContractAddress = "0x0aec55244a6b5AEF9Db1Aa1E15E1b8807Df3226c";
const privacyPoolContractAddress = "0x0BeC794081343E35e7BE7c294Ac40a0Fa48A0321";
const usdcContractAddress = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; 

// --- NEW TSS SVG LOGO ---
const TssLogo = ({ width = 24, height = 24 }) => ( // Allow size override
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20V20H4V4Z" fill="var(--bg-light)" stroke="var(--accent)" strokeWidth="2"/>
    <path d="M8 9H16" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12H16" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 15H12" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Define supported tokens with SVG icons
const supportedTokens = {
  TSS: { 
    address: tssContractAddress, 
    symbol: 'TSS', 
    decimals: 18, 
    abi: TSSABI, // Use new ABI
    icon: ( <TssLogo /> ) // Use new Logo
  },
  USDC: { 
    address: usdcContractAddress, 
    symbol: 'USDC', 
    decimals: 6, 
    abi: TSSABI, // Using standard ERC20 ABI (TSSABI is also standard ERC20)
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#2775CA"/>
        <path d="M12.62 17.656C11.32 17.656 10.22 17.376 9.32 16.816C8.42 16.256 7.78 15.436 7.4 14.356L9.2 13.636C9.44 14.356 9.88 14.896 10.52 15.256C11.16 15.616 11.86 15.796 12.62 15.796C13.44 15.796 14.08 15.636 14.54 15.316C15 14.996 15.23 14.566 15.23 14.026C15.23 13.486 15.01 13.066 14.57 12.766C14.13 12.466 13.49 12.226 12.65 12.046C11.81 11.866 11.09 11.606 10.49 11.266C9.89 10.926 9.47 10.456 9.23 9.856C8.99 9.256 8.87 8.576 8.87 7.816C8.87 7.036 9.1 6.366 9.56 5.806C10.02 5.246 10.68 4.846 11.54 4.606L11.54 3H13.28V4.576C14.36 4.786 15.2 5.176 15.8 5.746C16.4 6.316 16.7 7.006 16.7 7.816L14.96 7.816C14.96 7.226 14.76 6.776 14.36 6.466C13.96 6.156 13.43 6 12.77 6C12.01 6 11.41 6.16 10.97 6.48C10.53 6.8 10.31 7.22 10.31 7.74C10.31 8.24 10.5 8.63 10.88 8.91C11.26 9.19 11.84 9.43 12.62 9.61C13.46 9.79 14.17 10.05 14.75 10.39C15.33 10.73 15.75 11.19 16.01 11.77C16.27 12.35 16.4 13.01 16.4 13.75C16.4 14.65 16.14 15.42 15.62 16.06C15.1 16.7 14.37 17.16 13.43 17.44V18.91H11.69V17.476C11.21 17.576 10.73 17.626 10.25 17.626C10.01 17.626 9.77 17.626 9.53 17.626L10.25 17.656H12.62Z" fill="white"/>
      </svg>
    )
  },
};

const privacyPoolABI = PrivacyPoolABI;

const correctNetwork = {
  chainId: "0x66eee", // 421614 (Arbitrum Sepolia)
  chainName: "Arbitrum Sepolia",
  nativeCurrency: { name: "Arbitrum Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
};

// --- NEW CUSTOM TOKEN SELECTOR COMPONENT ---
const TokenSelector = ({ selectedToken, setSelectedTokenSymbol }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (symbol) => {
    setSelectedTokenSymbol(symbol);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="token-selector-custom" ref={dropdownRef}>
      <label>Token:</label>
      <button className="token-selector-button" onClick={() => setIsOpen(!isOpen)}>
        <span className="token-icon">{selectedToken.icon}</span>
        {selectedToken.symbol}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="token-dropdown">
          {Object.keys(supportedTokens).map(symbol => {
            const token = supportedTokens[symbol];
            return (
              <div
                key={symbol}
                className="token-option"
                onClick={() => handleSelect(symbol)}
              >
                <span className="token-icon">{token.icon}</span>
                {token.symbol}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- HELPER FUNCTIONS ---

const MainApp = ({
  walletAddress,
  isTssOwner, // *** CHANGED: isMscOwner -> isTssOwner ***
  balances,
  selectedTokenSymbol,
  setSelectedTokenSymbol,
  handleRefresh,
  handleDisconnect,
  tssContract, // *** CHANGED: mscContract -> tssContract ***
  privacyPoolContract,
  provider
}) => {
  const [activeTab, setActiveTab] = useState(isTssOwner ? "mint" : "send"); // *** CHANGED ***
  const [status, setStatus] = useState("Status: Ready.");
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [redeemSecret, setRedeemSecret] = useState("");
  const [redeemRecipient, setRedeemRecipient] = useState("");

  const selectedToken = supportedTokens[selectedTokenSymbol];

  // --- Hashing Function (Stable) ---
  const getSecretHash = (secret) => {
    if (isHexString(secret) && secret.length === 34) {
      try {
        return solidityPackedKeccak256(["bytes16"], [secret]);
      } catch (e) { console.error("Error hashing bytes16:", e); return null; }
    } else {
      console.warn("Secret not bytes16 hex, hashing as string.");
      return solidityPackedKeccak256(["string"], [secret]);
    }
  };

  // --- Clipboard Function ---
  const copyToClipboard = (text) => {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus("Copy"), 1500);
    } catch (err) { console.error('Failed to copy text: ', err); setCopyStatus("Failed"); setTimeout(() => setCopyStatus("Copy"), 1500); }
    document.body.removeChild(tempInput);
  };

  // --- TAB HANDLERS ---

  const handleMint = async () => {
    // Mint only works for TSS contract
    if (!tssContract || !mintAmount) return; // *** CHANGED ***
    setStatus("Status: Minting TSS..."); // *** CHANGED ***
    try {
      const amount = parseUnits(mintAmount, supportedTokens.TSS.decimals); // *** CHANGED ***
      const transaction = await tssContract.mint(walletAddress, amount); // *** CHANGED ***
      await transaction.wait();
      setStatus("Status: TSS Mint successful! Refreshing balances..."); // *** CHANGED ***
      await handleRefresh();
      setMintAmount("");
    } catch (err) { console.error("Error minting TSS: ", err); setStatus("Error: TSS Minting failed."); } // *** CHANGED ***
  };

  const handleBurn = async () => {
    // Burn only works for TSS contract
    if (!tssContract || !burnAmount) return; // *** CHANGED ***
    setStatus("Status: Burning TSS..."); // *** CHANGED ***
    try {
      const amount = parseUnits(burnAmount, supportedTokens.TSS.decimals); // *** CHANGED ***
      const transaction = await tssContract.burn(amount); // *** CHANGED ***
      await transaction.wait();
      setStatus("Status: TSS Burn successful! Refreshing balances..."); // *** CHANGED ***
      await handleRefresh();
      setBurnAmount("");
    } catch (err) { console.error("Error burning TSS: ", err); setStatus("Error: TSS Burning failed."); } // *** CHANGED ***
  };

  const handleSend = async () => {
    if (!privacyPoolContract || !sendAmount || !selectedToken || !provider) return;
    setStatus(`Status: Generating secure ${selectedTokenSymbol} note...`);
    setGeneratedSecret(""); setCopyStatus("Copy");

    try {
      const newSecret = hexlify(randomBytes(16));
      setGeneratedSecret(newSecret);
      const secretHash = getSecretHash(newSecret);
      if (!secretHash) {
         setStatus("Error: Failed to generate secret hash.");
         return;
      }
      console.log(`SENDING ${selectedTokenSymbol} - Secret:`, newSecret, "Hash:", secretHash);

      const amount = parseUnits(sendAmount, selectedToken.decimals);
      const signer = await provider.getSigner();
      const tokenContract = new Contract(selectedToken.address, selectedToken.abi, signer);

      setStatus(`Status: 1/2 Approving ${selectedTokenSymbol} spend...`);
      const approveTx = await tokenContract.approve(privacyPoolContractAddress, amount);
      await approveTx.wait();
      setStatus(`Status: 1/2 Approved! 2/2 Generating ${selectedTokenSymbol} note...`);

      const generateTx = await privacyPoolContract.generatePrivacyNote(selectedToken.address, amount, secretHash);
      await generateTx.wait();

      setStatus(`Status: Private ${selectedTokenSymbol} note generated! Copy secret.`);
      await handleRefresh();
      setSendAmount("");
    } catch (err) { console.error(`Error generating ${selectedTokenSymbol} note: `, err); setStatus(`Error: Failed to generate ${selectedTokenSymbol} note.`); setGeneratedSecret(""); }
  };

  const handleRedeem = async () => {
    if (!privacyPoolContract || !redeemSecret || !redeemRecipient) return setStatus("Status: Fill all fields.");
    if (!isAddress(redeemRecipient)) return setStatus("Status: Invalid recipient address.");

    setStatus("Status: Redeeming note...");
    try {
      const secretHash = getSecretHash(redeemSecret);
       if (!secretHash) {
         setStatus("Error: Failed to generate secret hash from input.");
         return;
      }
      console.log("REDEEMING - Secret:", redeemSecret, "Hash:", secretHash);

      const transaction = await privacyPoolContract.redeemNote(secretHash, redeemRecipient);
      await transaction.wait();

      setStatus("Status: Note redeemed successfully! Refreshing balances...");
      await handleRefresh();
      setRedeemSecret(""); setRedeemRecipient("");
    } catch (err) { console.error("Error redeeming note: ", err); setStatus("Error: Redeem failed. Is the secret correct?"); }
  };

  // --- RENDER LOGIC ---
  const renderActiveTab = () => {
    switch(activeTab) {
      case "send":
        return (
          <div className="app-card-content">
            <h3 className="app-card-title">Create Private Note</h3>
            <p className="card-subtitle">Lock tokens in the contract and generate a secure one-time secret.</p>
            <TokenSelector
              selectedToken={selectedToken}
              setSelectedTokenSymbol={(symbol) => {
                setSelectedTokenSymbol(symbol);
                setSendAmount(""); setGeneratedSecret(""); setStatus("Status: Ready.");
              }}
            />
            <label>Amount to send privately</label>
            <input type="number" placeholder={`e.g., 100 ${selectedTokenSymbol}`} value={sendAmount} onChange={e => setSendAmount(e.target.value)} />
            <button className="button-primary" onClick={handleSend} disabled={!sendAmount || parseFloat(sendAmount) <= 0 || status.includes("...")}>
              {status.includes("...") ? status : `Approve & Generate ${selectedTokenSymbol} Note`}
            </button>
            {generatedSecret && ( <div className="secret-display-box"> <strong>IMPORTANT:</strong> Send secret to recipient. Not recoverable. <div className="secret-copy-wrapper"> <input type="text" readOnly value={generatedSecret} /> <button className="button-secondary" onClick={() => copyToClipboard(generatedSecret)}>{copyStatus}</button> </div> </div> )}
          </div>
        );
      case "receive":
        return (
          <div className="app-card-content">
            <h3 className="app-card-title">Redeem Private Note</h3>
            <p className="card-subtitle">Enter the secret you received to claim your funds. The contract knows which token it is for.</p>
            <label>Secret Note</label>
            <input type="text" placeholder="Paste the secret note (e.g., 0x...)" value={redeemSecret} onChange={e => setRedeemSecret(e.target.value)} />
            <label className="label-with-button"> <span>Recipient Address</span> <button className="button-link" onClick={() => setRedeemRecipient(walletAddress)}>Auto-fill</button> </label>
            <input type="text" placeholder="Paste the recipient's address" value={redeemRecipient} onChange={e => setRedeemRecipient(e.target.value)} />
            <button className="button-primary" onClick={handleRedeem} disabled={!redeemSecret || !redeemRecipient || status.includes("...")}>
              {status.includes("...") ? "Redeeming..." : "Redeem Note"}
            </button>
          </div>
        );
      case "mint":
        return ( <div className="app-card-content"> <h3 className="app-card-title">Mint New Tokens (Admin Only)</h3> <p className="card-subtitle">Create new TSS utility tokens.</p> <label>Amount to Mint (TSS)</label> <input type="number" placeholder="e.g., 1000" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} /> <button className="button-primary" onClick={handleMint} disabled={!mintAmount || parseFloat(mintAmount) <= 0 || status.includes("...")}> {status.includes("...") ? "Minting..." : "Mint Tokens"} </button> </div> ); // *** CHANGED ***
      case "burn":
        return ( <div className="app-card-content"> <h3 className="app-card-title">Burn Tokens (Admin Only)</h3> <p className="card-subtitle">Destroy TSS tokens from your balance.</p> <label>Amount to Burn (TSS)</label> <input type="number" placeholder="e.g., 100" value={burnAmount} onChange={e => setBurnAmount(e.target.value)} /> <button className="button-primary" onClick={handleBurn} disabled={!burnAmount || parseFloat(burnAmount) <= 0 || status.includes("...")}> {status.includes("...") ? "Burning..." : "Burn Tokens"} </button> </div> ); // *** CHANGED ***
      default: return null;
    }
  }

  return (
    <div className="dashboard-container">
      <header className="main-header"> 
        <div className="logo"> 
          <TssLogo />
          The Secret Service
        </div> 
        <button className="wallet-button" onClick={handleDisconnect}> 
          {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)} (Disconnect) 
        </button> 
      </header>
      <div className="main-content">
        <aside className="sidebar-left"> 
          <nav> 
            <p className="sidebar-title">OPERATIONS</p> 
            <ul> 
              <li> <button className={`nav-button ${activeTab === 'send' ? 'active' : ''}`} onClick={() => { setActiveTab('send'); setGeneratedSecret(''); }}> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path></svg> Send </button> </li> 
              <li> <button className={`nav-button ${activeTab === 'receive' ? 'active' : ''}`} onClick={() => setActiveTab('receive')}> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,120H59.31l58.35-58.34a8,8,0,0,0-11.32-11.32l-72,72a8,8,0,0,0,0,11.32l72,72a8,8,0,0,0,11.32-11.32L59.31,136H216a8,8,0,0,0,0-16Z"></path></svg> Receive </button> </li> 
              {isTssOwner && ( <> <li> <button className={`nav-button ${activeTab === 'mint' ? 'active' : ''}`} onClick={() => setActiveTab('mint')}> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg> Mint (Admin) </button> </li> <li> <button className={`nav-button ${activeTab === 'burn' ? 'active' : ''}`} onClick={() => setActiveTab('burn')}> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M204,56H200V48a16,16,0,0,0-16-16H72A16,16,0,0,0,56,48v8H52a20,20,0,0,0-20,20V208a20,20,0,0,0,20,20H204a20,20,0,0,0,20-20V76A20,20,0,0,0,204,56ZM72,48H184v8H72Z"></path></svg> Burn (Admin) </button> </li> </> )} 
            </ul> 
          </nav> 
          <nav className="sidebar-section"> <p className="sidebar-title">INTEL (DEMO)</p> <ul> <li><button className="nav-button-disabled">Studio</button></li> <li><button className="nav-button-disabled">AlphaScan</button></li> </ul> </nav> 
        </aside>
        <main className="center-content">
          <div className="balance-card"> 
            <div> 
              <p className="card-subtitle">Your Balance ({selectedTokenSymbol})</p> 
              <h2>{parseFloat(balances[selectedTokenSymbol] || "0").toFixed(selectedToken.decimals === 6 ? 2 : 2)} {selectedTokenSymbol}</h2> 
            </div> 
            <button className="button-secondary" onClick={handleRefresh} disabled={status.includes("...")}>Refresh</button> 
          </div>
          <div className="app-card"> 
            <div className="app-card-tabs"> 
              {isTssOwner && <button className={activeTab === 'mint' ? 'active' : ''} onClick={() => setActiveTab('mint')}> Mint </button>} 
              <button className={activeTab === 'send' ? 'active' : ''} onClick={() => { setActiveTab('send'); setGeneratedSecret(''); }}> Send </button> 
              <button className={activeTab === 'receive' ? 'active' : ''} onClick={() => setActiveTab('receive')}> Receive </button> 
              {isTssOwner && <button className={activeTab === 'burn' ? 'active' : ''} onClick={() => setActiveTab('burn')}> Burn </button>} 
            </div> 
            <div className="status-bar">
              {status.includes("...") ? ( <div className="spinner"></div> ) : null}
              {status}
            </div> 
            {renderActiveTab()} 
          </div>
        </main>
        <aside className="sidebar-right"> 
          <div className="info-box"> 
            <h4>MISSION BRIEFING</h4> 
            <p>Welcome, Agent. This is a live demonstration of the TSS Privacy Pool on Arbitrum Sepolia.</p> 
          </div> 
          <div className="info-box"> 
            <h4>STANDARD OPERATING PROCEDURE</h4> 
            <ol> 
              <li><strong>Select Token & Send:</strong> Lock tokens (TSS/USDC) & generate secret note.</li> 
              <li><strong>Dead Drop:</strong> Send secret off-chain.</li> 
              <li><strong>Go Live:</strong> Use secret to redeem correct tokens.</li> 
            </ol> 
          </div> 
        </aside>
      </div>
    </div>
  );
}

// --- NEW LANDING PAGE COMPONENT ---
// This is the new, more professional landing page.
const LandingPage = ({ handleConnect }) => ( 
  <div className="landing-container">
    <header className="main-header landing-header"> 
      <div className="logo"> 
        <TssLogo />
        The Secret Service
      </div> 
      <nav className="landing-nav">
        <a href="#features">How It Works</a>
        <a href="#roadmap">Roadmap</a>
        <a href="#demo" className="nav-button-disabled">Demo</a> {/* This is a placeholder link */}
      </nav>
      <button className="button-primary-connect launch-button" onClick={handleConnect}>
        Launch App
      </button> 
    </header>
    
    <div className="hero-section">
      <h1 className="animate-fade-in-down">Discreet. Secure. Untraceable.</h1>
      <p className="hero-subtitle animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
        The Secret Service (TSS) is a decentralized protocol for fully anonymous token transfers.
        Send TSS or USDC on Arbitrum without leaving a public link on the blockchain.
      </p>
      <button className="button-primary-connect hero-button animate-fade-in-up" onClick={handleConnect}>
        Launch App & Connect Wallet
      </button>
      <p className="hero-demo-note animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        This is a public demo running on the Arbitrum Sepolia testnet.
      </p>
    </div>

    <div className="features-section" id="features">
      <div className="feature-card animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M140,164a12,12,0,1,1-12-12A12,12,0,0,1,140,164Zm-8-48V80a8,8,0,0,0-16,0v56a8,8,0,0,0,16,0Zm104,12A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path></svg>
        <h3>Untraceable Transfers</h3>
        <p>Your privacy is non-negotiable. Our protocol uses a "black box" smart contract to break the on-chain link between sender and receiver. Deposits and withdrawals are completely unlinked, ensuring total anonymity.</p>
      </div>
      <div className="feature-card animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A24,24,0,0,0,24,104V200a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V104A24,24,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM216,200a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V104a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8Z"></path></svg>
        <h3>Fort-Knox Security</h3>
        <p>We generate a unique, un-guessable cryptographic note for every deposit. This note is never revealed on-chain. Our protocol is secured against replay attacks and collisions, guaranteeing only you can access your funds.</p>
      </div>
      <div className="feature-card animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M168,152a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,152Zm-8-40H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm80-40H48A24,24,0,0,0,24,96V200a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V96A24,24,0,0,0,208,72ZM40,96a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8Z"></path></svg>
        <h3>Ecosystem-Wide Privacy</h3>
        <p>Privacy shouldn't be a feature, it should be a standard. Our privacy pool is a generic utility that can be extended to any ERC-20 token, starting with our native TSS token and bridged USDC.</p>
      </div>
    </div>

    <div className="get-started-section" id="demo">
      <div className="get-started-content">
        <h2>Get Started in 3 Steps</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Get Testnet Tokens</h3>
            <p>Connect to Arbitrum Sepolia and get test ETH from a faucet. You can also get our demo USDC from the official Circle Faucet to test multi-asset privacy.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Generate Secret Note</h3>
            <p>Go to the "Send" tab, choose your token (TSS or USDC), and enter an amount. Approve the transfer and generate your unique, one-time secret note.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Go Dark</h3>
            <p>Send the secret note (e.g., via Signal or Telegram) to your recipient. They use it on the "Receive" tab to claim the funds. The on-chain link is now broken.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="roadmap-section" id="roadmap">
      <h2>Project Roadmap</h2>
      <p className="hero-subtitle">Our MVP is complete. We are now seeking partners and funding to build the next generation of on-chain privacy.</p>
      <div className="roadmap-container">
        <div className="roadmap-item done">
          <div className="roadmap-dot"></div>
          <h4>V1: Core Protocol (Complete)</h4>
          <p>Secure, hash-based privacy pool contract deployed on Arbitrum Sepolia. Supports TSS and USDC.</p>
        </div>
        <div className="roadmap-item next">
          <div className="roadmap-dot"></div>
          <h4>V2: TSS Token Utility</h4>
          <p>Integrate the TSS token to be used for paying protocol fees, governance, and rewarding anonymity providers.</p>
        </div>
        <div className="roadmap-item">
          <div className="roadmap-dot"></div>
          <h4>V3: ZK-SNARK Integration</h4>
          <p>Migrate the core protocol from a hash-based system to a full Zero-Knowledge Proof (zk-SNARK) model for ultimate, provable privacy.</p>
        </div>
      </div>
    </div>

    <footer className="landing-footer">
      <p>© 2025 The Secret Service (TSS) Protocol. This is a public demo project for demonstration purposes only.</p>
    </footer>

  </div> 
);

// --- MAIN APP COMPONENT (CONTROLLER) ---
function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [provider, setProvider] = useState(null);
  const [isTssOwner, setIsTssOwner] = useState(false); // *** CHANGED ***
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState('TSS'); // *** CHANGED ***
  const [balances, setBalances] = useState({});
  const [tssContract, setTssContract] = useState(null); // *** CHANGED ***
  const [privacyPoolContract, setPrivacyPoolContract] = useState(null);

  const memoizedProvider = useMemo(() => window.ethereum ? new BrowserProvider(window.ethereum) : null, []);

  useEffect(() => {
    const initContracts = async () => {
      if (memoizedProvider && walletAddress) {
        try {
            const signer = await memoizedProvider.getSigner();
            setTssContract(new Contract(tssContractAddress, TSSABI, signer)); // *** CHANGED ***
            setPrivacyPoolContract(new Contract(privacyPoolContractAddress, privacyPoolABI, signer));
        } catch (error) {
            console.error("Error initializing contracts:", error);
            setTssContract(null); // *** CHANGED ***
            setPrivacyPoolContract(null);
        }
      } else {
        setTssContract(null); // *** CHANGED ***
        setPrivacyPoolContract(null);
      }
    };
    initContracts();
  }, [memoizedProvider, walletAddress]);


  const handleDisconnect = useCallback(() => {
    console.log("Disconnecting...");
    setWalletAddress("");
    setProvider(null);
    setBalances({});
    setIsTssOwner(false); // *** CHANGED ***
    setSelectedTokenSymbol('TSS'); // *** CHANGED ***
  }, []);

  const fetchBalance = useCallback(async (tokenSymbol, providerInstance, account) => {
    const token = supportedTokens[tokenSymbol];
    if (!token || !providerInstance || !account) return "0";
    try {
      const tokenContract = new Contract(token.address, token.abi, providerInstance);
      const balanceBigInt = await tokenContract.balanceOf(account);
      return formatUnits(balanceBigInt, token.decimals);
    } catch (err) {
      console.error(`Error fetching ${tokenSymbol} balance: `, err);
      return "0";
    }
  }, []);

  const fetchAllBalances = useCallback(async (providerInstance, account) => {
    const newBalances = {};
    console.log("Fetching all balances for account:", account);
    for (const symbol of Object.keys(supportedTokens)) {
      newBalances[symbol] = await fetchBalance(symbol, providerInstance, account);
    }
    setBalances(newBalances);
  }, [fetchBalance]);

  // *** CHANGED: Renamed function ***
  const fetchTssOwner = useCallback(async (account) => {
    console.log("Fetching TSS owner...");
    if (memoizedProvider && account) {
        try {
            // Use provider for read-only call
            const tempTssContract = new Contract(tssContractAddress, TSSABI, memoizedProvider); // *** CHANGED ***
            const ownerAddress = await tempTssContract.owner(); // *** CHANGED ***
            console.log("Contract owner:", ownerAddress);
            const isOwner = account.toLowerCase() === ownerAddress.toLowerCase();
            setIsTssOwner(isOwner); // *** CHANGED ***
            console.log("Is connected account owner?", isOwner);
        } catch (err) { 
            console.error("Error fetching TSS owner: ", err); // *** CHANGED ***
            setIsTssOwner(false); // *** CHANGED ***
        }
    } else {
        console.log("Cannot fetch owner - provider or account missing.");
        setIsTssOwner(false); // *** CHANGED ***
    }
  }, [memoizedProvider]);

  const checkNetwork = useCallback(async (providerInstance) => {
     if (!providerInstance) return false;
     try {
       const network = await providerInstance.getNetwork();
       const currentChainId = network.chainId.toString();
       const targetChainId = BigInt(correctNetwork.chainId).toString();
       if (currentChainId !== targetChainId) {
         try {
           await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: correctNetwork.chainId }] });
           const newNetwork = await providerInstance.getNetwork();
           return newNetwork.chainId.toString() === targetChainId;
         } catch (switchError) {
           if (switchError.code === 4902) {
             try { await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [correctNetwork] });
                 const newNetwork = await providerInstance.getNetwork();
                 return newNetwork.chainId.toString() === targetChainId;
             } catch (addError) { console.error("Failed add:", addError); return false; }
           } else { console.error("Failed switch:", switchError); return false; }
         }
       } return true;
     } catch (err) { console.error("Check network err:", err); return false; }
   }, []);

  const handleConnect = useCallback(async () => {
    console.log("handleConnect called");
    if (memoizedProvider) {
        try {
        console.log("Checking network...");
        const onCorrectNetwork = await checkNetwork(memoizedProvider);
        if (!onCorrectNetwork) return alert("Please switch to Arbitrum Sepolia.");
        console.log("Network OK.");

        console.log("Requesting accounts...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = getAddress(accounts[0]);
        console.log("Account:", account);

        setWalletAddress(account);
        setProvider(memoizedProvider); 

        // Manually trigger fetches after state is set
        await fetchAllBalances(memoizedProvider, account);
        await fetchTssOwner(account); // *** CHANGED ***

        console.log("Connection successful.");
        } catch (err) { 
          console.error("Connect wallet err: ", err); 
          handleDisconnect();
        }
    } else { alert('Wallet not detected.'); }
  }, [memoizedProvider, checkNetwork, fetchAllBalances, fetchTssOwner, handleDisconnect]); // *** CHANGED ***


  const handleRefresh = useCallback(() => {
     console.log("Refreshing balances...");
     if (provider && walletAddress) {
        fetchAllBalances(provider, walletAddress);
     }
  }, [provider, walletAddress, fetchAllBalances]);


  // Effect for account/network changes
  useEffect(() => {
    const { ethereum } = window;
    if (ethereum?.on) {
      const handleAccountsChanged = (accounts) => {
          console.log("Accounts changed:", accounts);
          const newAccount = accounts.length > 0 ? getAddress(accounts[0]) : null;
          const oldAccount = walletAddress ? getAddress(walletAddress) : null;
          
          if (newAccount && newAccount !== oldAccount) {
              console.log("Account actually changed, reconnecting...");
              handleConnect();
          } else if (!newAccount && oldAccount) {
              console.log("Account disconnected.");
              handleDisconnect();
          }
      };
      const handleChainChanged = (chainId) => {
          console.log("Chain changed:", chainId);
          handleConnect();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      console.log("Event listeners added.");

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
          console.log("Event listeners removed.");
        }
      };
    } else {
        console.log("Ethereum provider not found or does not support 'on'.");
    }
  }, [walletAddress, handleConnect, handleDisconnect]);


  // --- RENDER ---
  return (
    <div className="App">
      {!walletAddress ? (
        <LandingPage handleConnect={handleConnect} />
      ) : (
        <MainApp
          walletAddress={walletAddress}
          isTssOwner={isTssOwner} // *** CHANGED ***
          balances={balances}
          selectedTokenSymbol={selectedTokenSymbol}
          setSelectedTokenSymbol={setSelectedTokenSymbol}
          handleRefresh={handleRefresh}
          handleDisconnect={handleDisconnect}
          tssContract={tssContract} // *** CHANGED ***
          privacyPoolContract={privacyPoolContract}
          provider={provider}
        />
      )}
    </div>
  );
}

export default App;

