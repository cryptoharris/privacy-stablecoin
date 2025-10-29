/* global BigInt */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// Import ethers functions
import { BrowserProvider, Contract, formatUnits, parseUnits, solidityPackedKeccak256, randomBytes, hexlify, isAddress, isHexString, MaxUint256, getAddress } from 'ethers';

// Import ABIs
import MyStablecoinABI from './MyStablecoinABI.json';
import PrivacyPoolABI from './PrivacyPoolABI.json';
import './App.css';

// --- CONFIGURATION ---

// Deployed Contract Addresses on Arbitrum Sepolia
// !!! PASTE YOUR NEW, SECURE CONTRACT ADDRESSES HERE !!!
const mscContractAddress = "0x1E4b3753A1f189d8BBCcD03DB60dF4feb1555a84";
const privacyPoolContractAddress = "0x3D572AE8B5Ad85FE895E95E16f94E6C2C9014ec9";
// -----------------------------------------------------

const usdcContractAddress = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // Common Arbitrum Sepolia USDC address

// Define supported tokens with SVG icons
const supportedTokens = {
  MSC: { 
    address: mscContractAddress, // This will now use the new address
    symbol: 'MSC', 
    decimals: 18, 
    abi: MyStablecoinABI,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#27C07A" />
      </svg>
    )
  },
  USDC: { 
    address: usdcContractAddress, 
    symbol: 'USDC', 
    decimals: 6, 
    abi: MyStablecoinABI, // Using standard ERC20 ABI for balance/approve
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#2775CA"/>
        <path d="M12.62 17.656C11.32 17.656 10.22 17.376 9.32 16.816C8.42 16.256 7.78 15.436 7.4 14.356L9.2 13.636C9.44 14.356 9.88 14.896 10.52 15.256C11.16 15.616 11.86 15.796 12.62 15.796C13.44 15.796 14.08 15.636 14.54 15.316C15 14.996 15.23 14.566 15.23 14.026C15.23 13.486 15.01 13.066 14.57 12.766C14.13 12.466 13.49 12.226 12.65 12.046C11.81 11.866 11.09 11.606 10.49 11.266C9.89 10.926 9.47 10.456 9.23 9.856C8.99 9.256 8.87 8.576 8.87 7.816C8.87 7.036 9.1 6.366 9.56 5.806C10.02 5.246 10.68 4.846 11.54 4.606L11.54 3H13.28V4.576C14.36 4.786 15.2 5.176 15.8 5.746C16.4 6.316 16.7 7.006 16.7 7.816L14.96 7.816C14.96 7.226 14.76 6.776 14.36 6.466C13.96 6.156 13.43 6 12.77 6C12.01 6 11.41 6.16 10.97 6.48C10.53 6.8 10.31 7.22 10.31 7.74C10.31 8.24 10.5 8.63 10.88 8.91C11.26 9.19 11.84 9.43 12.62 9.61C13.46 9.79 14.17 10.05 14.75 10.39C15.33 10.73 15.75 11.19 16.01 11.77C16.27 12.35 16.4 13.01 16.4 13.75C16.4 14.65 16.14 15.42 15.62 16.06C15.1 16.7 14.37 17.16 13.43 17.44V18.91H11.69V17.476C11.21 17.576 10.73 17.626 10.25 17.626C10.01 17.626 9.77 17.626 9.53 17.626L10.25 17.656H12.62Z" fill="white"/>
      </svg>
    )
  },
};

// Privacy Pool ABI (used for send/receive of any token)
const privacyPoolABI = PrivacyPoolABI;

// Network Config
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

  // Close dropdown if clicking outside
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
  isMscOwner, // Renamed for clarity
  balances, // Now an object holding balances for multiple tokens
  selectedTokenSymbol, // State for the dropdown
  setSelectedTokenSymbol, // Function to update selected token
  handleRefresh,
  handleDisconnect,
  mscContract, // Specific contract instance for MSC mint/burn
  privacyPoolContract, // Contract instance for the PrivacyPool
  provider // Pass provider down for creating token contract instances
}) => {
  const [activeTab, setActiveTab] = useState(isMscOwner ? "mint" : "send");
  const [status, setStatus] = useState("Status: Ready.");

  // States for different tabs
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
    // Mint only works for MSC contract
    if (!mscContract || !mintAmount) return;
    setStatus("Status: Minting MSC...");
    try {
      const amount = parseUnits(mintAmount, supportedTokens.MSC.decimals);
      const transaction = await mscContract.mint(walletAddress, amount);
      await transaction.wait();
      setStatus("Status: MSC Mint successful! Refreshing balances...");
      await handleRefresh(); // Refresh all balances
      setMintAmount("");
    } catch (err) { console.error("Error minting MSC: ", err); setStatus("Error: MSC Minting failed."); }
  };

  const handleBurn = async () => {
    // Burn only works for MSC contract
    if (!mscContract || !burnAmount) return;
    setStatus("Status: Burning MSC...");
    try {
      const amount = parseUnits(burnAmount, supportedTokens.MSC.decimals);
      const transaction = await mscContract.burn(amount);
      await transaction.wait();
      setStatus("Status: MSC Burn successful! Refreshing balances...");
      await handleRefresh(); // Refresh all balances
      setBurnAmount("");
    } catch (err) { console.error("Error burning MSC: ", err); setStatus("Error: MSC Burning failed."); }
  };

  const handleSend = async () => {
    // Send works with the PrivacyPool for the selected token
    if (!privacyPoolContract || !sendAmount || !selectedToken || !provider) return; // Added provider check
    setStatus(`Status: Generating secure ${selectedTokenSymbol} note...`);
    setGeneratedSecret(""); setCopyStatus("Copy");

    try {
      const newSecret = hexlify(randomBytes(16));
      setGeneratedSecret(newSecret);
      const secretHash = getSecretHash(newSecret);
      if (!secretHash) { // Check if hashing failed
         setStatus("Error: Failed to generate secret hash.");
         return;
      }
      console.log(`SENDING ${selectedTokenSymbol} - Secret:`, newSecret, "Hash:", secretHash);


      const amount = parseUnits(sendAmount, selectedToken.decimals);

      // --- Get Token Contract Instance for Approval ---
      // We need to approve the PRIVACY POOL to spend the SELECTED TOKEN
      const signer = await provider.getSigner(); // Get signer for transaction
      const tokenContract = new Contract(selectedToken.address, selectedToken.abi, signer);


      // --- Step 1: Approve PrivacyPool to spend the token ---
      setStatus(`Status: 1/2 Approving ${selectedTokenSymbol} spend...`);
      // Approve the privacy pool address to spend the calculated amount
      const approveTx = await tokenContract.approve(privacyPoolContractAddress, amount);
      await approveTx.wait();
      setStatus(`Status: 1/2 Approved! 2/2 Generating ${selectedTokenSymbol} note...`);

      // --- Step 2: Call PrivacyPool's generatePrivacyNote ---
      // Pass the selected token address, amount, and hash
      const generateTx = await privacyPoolContract.generatePrivacyNote(selectedToken.address, amount, secretHash);
      await generateTx.wait();

      setStatus(`Status: Private ${selectedTokenSymbol} note generated! Copy secret.`);
      await handleRefresh(); // Refresh balances
      setSendAmount(""); // Clear amount after success
    } catch (err) { console.error(`Error generating ${selectedTokenSymbol} note: `, err); setStatus(`Error: Failed to generate ${selectedTokenSymbol} note.`); setGeneratedSecret(""); }
  };

  const handleRedeem = async () => {
    // Redeem works with the PrivacyPool
    if (!privacyPoolContract || !redeemSecret || !redeemRecipient) return setStatus("Status: Fill all fields.");
    if (!isAddress(redeemRecipient)) return setStatus("Status: Invalid recipient address.");

    setStatus("Status: Redeeming note...");
    try {
      const secretHash = getSecretHash(redeemSecret);
       if (!secretHash) { // Check if hashing failed
         setStatus("Error: Failed to generate secret hash from input.");
         return;
      }
      console.log("REDEEMING - Secret:", redeemSecret, "Hash:", secretHash);


      // Call PrivacyPool's redeemNote with hash and recipient
      // The contract knows which token to send based on the hash
      const transaction = await privacyPoolContract.redeemNote(secretHash, redeemRecipient);
      await transaction.wait();

      setStatus("Status: Note redeemed successfully! Refreshing balances...");
      await handleRefresh(); // Refresh balances
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
            
            {/* Use new TokenSelector component */}
            <TokenSelector
              selectedToken={selectedToken}
              setSelectedTokenSymbol={(symbol) => {
                setSelectedTokenSymbol(symbol);
                setSendAmount(""); // Clear amount when changing token
                setGeneratedSecret(""); // Clear generated secret
                setStatus("Status: Ready."); // Reset status
              }}
            />

            <label>Amount to send privately</label>
            <input 
              type="number" 
              placeholder={`e.g., 100 ${selectedTokenSymbol}`} 
              value={sendAmount} 
              onChange={e => setSendAmount(e.target.value)} 
            />
            
            <button className="button-primary" onClick={handleSend} disabled={!sendAmount || parseFloat(sendAmount) <= 0 || status.includes("...")}>
              {status.includes("...") ? status : `Approve & Generate ${selectedTokenSymbol} Note`}
            </button>
            
            {generatedSecret && ( 
              <div className="secret-display-box"> 
                <strong>IMPORTANT:</strong> Send secret to recipient. Not recoverable. 
                <div className="secret-copy-wrapper"> 
                  <input type="text" readOnly value={generatedSecret} /> 
                  <button className="button-secondary" onClick={() => copyToClipboard(generatedSecret)}>{copyStatus}</button> 
                </div> 
              </div> 
            )}
          </div>
        );
      case "receive":
        return (
          <div className="app-card-content">
            <h3 className="app-card-title">Redeem Private Note</h3>
            <p className="card-subtitle">Enter the secret you received to claim your funds. The contract knows which token it is for.</p>
            
            <label>Secret Note</label>
            <input type="text" placeholder="Paste the secret note (e.g., 0x...)" value={redeemSecret} onChange={e => setRedeemSecret(e.target.value)} />
            
            <label className="label-with-button"> 
              <span>Recipient Address</span> 
              <button className="button-link" onClick={() => setRedeemRecipient(walletAddress)}>Auto-fill</button> 
            </label>
            <input type="text" placeholder="Paste the recipient's address" value={redeemRecipient} onChange={e => setRedeemRecipient(e.target.value)} />
            
            <button className="button-primary" onClick={handleRedeem} disabled={!redeemSecret || !redeemRecipient || status.includes("...")}>
              {status.includes("...") ? "Redeeming..." : "Redeem Note"}
            </button>
          </div>
        );
      case "mint": // Only MSC
        return ( 
          <div className="app-card-content"> 
            <h3 className="app-card-title">Mint New Tokens (Admin Only)</h3> 
            <p className="card-subtitle">Create new MSC tokens.</p> 
            <label>Amount to Mint (MSC)</label> 
            <input type="number" placeholder="e.g., 1000" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} /> 
            <button className="button-primary" onClick={handleMint} disabled={!mintAmount || parseFloat(mintAmount) <= 0 || status.includes("...")}> 
              {status.includes("...") ? "Minting..." : "Mint Tokens"} 
            </button> 
          </div> 
        );
      case "burn": // Only MSC
        return ( 
          <div className="app-card-content"> 
            <h3 className="app-card-title">Burn Tokens (Admin Only)</h3> 
            <p className="card-subtitle">Destroy MSC tokens from your balance.</p> 
            <label>Amount to Burn (MSC)</label> 
            <input type="number" placeholder="e.g., 100" value={burnAmount} onChange={e => setBurnAmount(e.target.value)} /> 
            <button className="button-primary" onClick={handleBurn} disabled={!burnAmount || parseFloat(burnAmount) <= 0 || status.includes("...")}> 
              {status.includes("...") ? "Burning..." : "Burn Tokens"} 
            </button> 
          </div> 
        );
      default: return null;
    }
  }

  return (
    <div className="dashboard-container">
      <header className="main-header"> 
        <div className="logo"> 
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="var(--accent)" />
          </svg> 
          Privacy Stablecoin 
        </div> 
        <button className="wallet-button" onClick={handleDisconnect}> 
          {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)} (Disconnect) 
        </button> 
      </header>
      <div className="main-content">
        <aside className="sidebar-left"> 
          <nav> 
            <p className="sidebar-title">EXPLORE</p> 
            <ul> 
              <li> 
                <button 
                  className={`nav-button ${activeTab === 'send' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('send'); setGeneratedSecret(''); }}
                > 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path></svg>
                  Send 
                </button> 
              </li> 
              <li> 
                <button 
                  className={`nav-button ${activeTab === 'receive' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('receive')}
                > 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,120H59.31l58.35-58.34a8,8,0,0,0-11.32-11.32l-72,72a8,8,0,0,0,0,11.32l72,72a8,8,0,0,0,11.32-11.32L59.31,136H216a8,8,0,0,0,0-16Z"></path></svg>
                  Receive 
                </button> 
              </li> 
              {isMscOwner && ( 
                <> 
                  <li> 
                    <button 
                      className={`nav-button ${activeTab === 'mint' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('mint')}
                    > 
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
                      Mint (Admin) 
                    </button> 
                  </li> 
                  <li> 
                    <button 
                      className={`nav-button ${activeTab === 'burn' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('burn')}
                    > 
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M204,56H200V48a16,16,0,0,0-16-16H72A16,16,0,0,0,56,48v8H52a20,20,0,0,0-20,20V208a20,20,0,0,0,20,20H204a20,20,0,0,0,20-20V76A20,20,0,0,0,204,56ZM72,48H184v8H72Z"></path></svg>
                      Burn (Admin) 
                    </button> 
                  </li> 
                </> 
              )} 
            </ul> 
          </nav> 
          <nav className="sidebar-section"> 
            <p className="sidebar-title">TOOLS (DEMO)</p> 
            <ul> 
              <li><button className="nav-button-disabled">Studio</button></li> 
              <li><button className="nav-button-disabled">AlphaScan</button></li> 
            </ul> 
          </nav> 
        </aside>
        <main className="center-content">
          <div className="balance-card"> 
            <div> 
              <p className="card-subtitle">Your Balance ({selectedTokenSymbol})</p> 
              <h2>{parseFloat(balances[selectedTokenSymbol] || "0").toFixed(selectedToken.decimals === 6 ? 2 : 2)} {selectedTokenSymbol}</h2> {/* Adjust decimals display */} 
            </div> 
            <button className="button-secondary" onClick={handleRefresh} disabled={status.includes("...")}>Refresh</button> 
          </div>
          <div className="app-card"> 
            <div className="app-card-tabs"> 
              {isMscOwner && <button className={activeTab === 'mint' ? 'active' : ''} onClick={() => setActiveTab('mint')}> Mint </button>} 
              <button 
                className={activeTab === 'send' ? 'active' : ''} 
                onClick={() => { setActiveTab('send'); setGeneratedSecret(''); }}
              > 
                Send 
              </button> 
              <button 
                className={activeTab === 'receive' ? 'active' : ''} 
                onClick={() => setActiveTab('receive')}
              > 
                Receive 
              </button> 
              {isMscOwner && <button className={activeTab === 'burn' ? 'active' : ''} onClick={() => setActiveTab('burn')}> Burn </button>} 
            </div> 
            <div className="status-bar">
              {status.includes("...") ? (
                <div className="spinner"></div> 
              ) : null}
              {status}
            </div> 
            {renderActiveTab()} 
          </div>
        </main>
        <aside className="sidebar-right"> 
          <div className="info-box"> 
            <h4>PROJECT NEWS</h4> 
            <p>Multi-Token Privacy Pool now live on Arbitrum Sepolia! Send MSC or USDC privately.</p> 
          </div> 
          <div className="info-box"> 
            <h4>HOW IT WORKS</h4> 
            <ol> 
              <li><strong>Select Token & Send:</strong> Lock tokens (MSC/USDC) & generate secret note.</li> 
              <li><strong>Transfer:</strong> Send secret off-chain.</li> 
              <li><strong>Receive:</strong> Use secret to redeem correct tokens.</li> 
            </ol> 
          </div> 
        </aside>
      </div>
    </div>
  );
}

// --- LANDING PAGE ---
const LandingPage = ({ handleConnect }) => ( 
  <div className="landing-container"> 
    <div className="landing-box"> 
      <div className="logo"> 
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="var(--accent)" />
        </svg> 
        <h2>Privacy Stablecoin</h2>
      </div>
      <p>Send MSC or USDC anonymously on Arbitrum Sepolia. Connect your wallet.</p> 
      <button className="button-primary-connect" onClick={handleConnect}>Connect Wallet</button> 
    </div> 
  </div> 
);

// --- MAIN APP COMPONENT (CONTROLLER) ---
function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [provider, setProvider] = useState(null);
  const [isMscOwner, setIsMscOwner] = useState(false);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState('MSC'); // Default to MSC
  const [balances, setBalances] = useState({}); // Store balances { MSC: '...', USDC: '...' }

  // Memoized contract instances
  const memoizedProvider = useMemo(() => window.ethereum ? new BrowserProvider(window.ethereum) : null, []);

  // Use useEffect to create contract instances *after* provider and walletAddress are set
  const [mscContract, setMscContract] = useState(null);
  const [privacyPoolContract, setPrivacyPoolContract] = useState(null);

  useEffect(() => {
    const initContracts = async () => {
      if (memoizedProvider && walletAddress) {
        try {
            const signer = await memoizedProvider.getSigner(); // Get signer when needed
            setMscContract(new Contract(mscContractAddress, supportedTokens.MSC.abi, signer));
            setPrivacyPoolContract(new Contract(privacyPoolContractAddress, privacyPoolABI, signer));
        } catch (error) {
            console.error("Error initializing contracts:", error);
            setMscContract(null);
            setPrivacyPoolContract(null);
        }
      } else {
        setMscContract(null);
        setPrivacyPoolContract(null);
      }
    };
    initContracts();
  }, [memoizedProvider, walletAddress]); // Dependencies: provider and walletAddress


  // --- CORE FUNCTIONS ---
  // Using useCallback to stabilize function references for useEffect dependencies
  const handleDisconnect = useCallback(() => {
    console.log("Disconnecting...");
    setWalletAddress("");
    setProvider(null); // This will trigger useEffect to clear contracts
    setBalances({});
    setIsMscOwner(false);
    setSelectedTokenSymbol('MSC');
  }, []); // Empty dependency array, this function is stable

  const fetchBalance = useCallback(async (tokenSymbol, providerInstance, account) => {
    const token = supportedTokens[tokenSymbol];
    if (!token || !providerInstance || !account) return "0";
    try {
      const tokenContract = new Contract(token.address, token.abi, providerInstance); // Use provider for read-only
      const balanceBigInt = await tokenContract.balanceOf(account);
      return formatUnits(balanceBigInt, token.decimals);
    } catch (err) {
      console.error(`Error fetching ${tokenSymbol} balance: `, err);
      return "0";
    }
  }, []); // Stable function

  const fetchAllBalances = useCallback(async (providerInstance, account) => {
    const newBalances = {};
    console.log("Fetching all balances for account:", account);
    for (const symbol of Object.keys(supportedTokens)) {
      newBalances[symbol] = await fetchBalance(symbol, providerInstance, account);
    }
    setBalances(newBalances);
  }, [fetchBalance]); // Depends on fetchBalance

  const fetchMscOwner = useCallback(async (account) => {
    console.log("Fetching MSC owner...");
    // Create a temporary contract instance just for this read operation
    // This avoids dependency on the stateful mscContract, which might not be set yet
    if (memoizedProvider && account) {
        try {
            // Use provider for read-only call
            const tempMscContract = new Contract(mscContractAddress, MyStablecoinABI, memoizedProvider); 
            const ownerAddress = await tempMscContract.owner();
            console.log("Contract owner:", ownerAddress);
            const isOwner = account.toLowerCase() === ownerAddress.toLowerCase();
            setIsMscOwner(isOwner);
            console.log("Is connected account owner?", isOwner);
        } catch (err) { 
            console.error("Error fetching MSC owner: ", err); 
            setIsMscOwner(false); 
        }
    } else {
        console.log("Cannot fetch owner - provider or account missing.");
        setIsMscOwner(false);
    }
  }, [memoizedProvider]); // Depends on memoizedProvider

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
   }, []); // Stable function

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
        await fetchMscOwner(account);

        console.log("Connection successful.");
        } catch (err) { 
          console.error("Connect wallet err: ", err); 
          handleDisconnect(); // Disconnect on error
        }
    } else { alert('Wallet not detected.'); }
  }, [memoizedProvider, checkNetwork, fetchAllBalances, fetchMscOwner, handleDisconnect]); // Add all stable dependencies


  const handleRefresh = useCallback(() => {
     console.log("Refreshing balances...");
     if (provider && walletAddress) {
        fetchAllBalances(provider, walletAddress);
     }
  }, [provider, walletAddress, fetchAllBalances]); // Add dependencies


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
              handleConnect(); // Re-run full connect logic
          } else if (!newAccount && oldAccount) {
              console.log("Account disconnected.");
              handleDisconnect();
          }
      };
      const handleChainChanged = (chainId) => {
          console.log("Chain changed:", chainId);
          handleConnect(); // Re-run connect logic to check network
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
  }, [walletAddress, handleConnect, handleDisconnect]); // Add stable handlers as dependencies


  // --- RENDER ---
  return (
    <div className="App">
      {!walletAddress ? (
        <LandingPage handleConnect={handleConnect} />
      ) : (
        <MainApp
          walletAddress={walletAddress}
          isMscOwner={isMscOwner}
          balances={balances}
          selectedTokenSymbol={selectedTokenSymbol}
          setSelectedTokenSymbol={setSelectedTokenSymbol}
          handleRefresh={handleRefresh}
          handleDisconnect={handleDisconnect}
          mscContract={mscContract} // Pass MSC contract instance
          privacyPoolContract={privacyPoolContract} // Pass PrivacyPool contract instance
          provider={provider}
        />
      )}
    </div>
  );
}

export default App;

