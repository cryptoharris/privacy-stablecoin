/* global BigInt */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// 👇 ADD THIS LINE
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
// CSS is no longer imported, it is inlined below

// --- INLINED ABIs ---
// This ABI is for a standard ERC20 + Ownable + Mint/Burn functions
const TSSABI = [
  { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }
];

// This ABI is for the PrivacyPool contract
const PrivacyPoolABI = [
  { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType":"bytes32", "name": "secretHash", "type": "bytes32" } ], "name": "generatePrivacyNote", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "bytes32", "name": "secretHash", "type": "bytes32" }, { "internalType": "address", "name": "recipient", "type": "address" } ], "name": "redeemNote", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// --- INLINED CSS ---
const InjectedStyles = () => {
  return (
    <style>{`
/* ---
Root Variables: "Secret Service" Dark Theme (Green Accent)
--- */
:root {
  --font-main: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  
  /* Agency Dark Palette */
  --bg-darkest: #030303;    /* Absolute black */
  --bg-dark: #0A0A0A;      /* Main app background, sidebars */
  --bg-light: #131313;    /* Card backgrounds */
  --bg-lighter: #1E1E1E;   /* Input fields, hover states */
  --bg-lightest: #2A2A2A;  /* Borders */

  /* Tech Green Accent */
  --accent: #27C07A;       /* Bright green for buttons & highlights */
  --accent-dark: #1F9962;  /* Button hover */
  --accent-faded: rgba(39, 192, 122, 0.1); /* Faded green for active tabs */
  --accent-glow: rgba(39, 192, 122, 0.3); /* Glow effect */

  /* Text colors */
  --text-primary: #EAEAEA;
  --text-secondary: #999999;
  --text-tertiary: #666666;

  /* Other */
  --radius: 12px;
  --radius-small: 8px;
  --shadow-dark: 0 8px 30px rgba(0, 0, 0, 0.3);
  --shadow-accent: 0 0 20px var(--accent-glow);
}

/* ---
Global & Body Styles
--- */
body {
  margin: 0;
  font-family: var(--font-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-darkest);
  color: var(--text-primary);
  font-size: 16px;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.App {
  text-align: center;
}

/* Remove default button outlines */
button:focus,
input:focus {
  outline: 2px solid var(--accent);
  box-shadow: 0 0 10px var(--accent-glow);
}
button:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

/* ---
Scrollbar
--- */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-dark);
}
::-webkit-scrollbar-thumb {
  background: var(--bg-lighter);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}


/* ---
NEW Landing Page
--- */
.landing-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--bg-darkest);
  position: relative;
  overflow: hidden; /* Contains aurora */
}

/* ---
NEW Aurora Background Animation
--- */
.aurora-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}
.aurora-shape {
  position: absolute;
  filter: blur(150px);
  opacity: 0.15;
  border-radius: 50%;
}
.aurora-shape.shape-1 {
  width: 600px;
  height: 600px;
  background: var(--accent);
  top: -200px;
  left: -200px;
  animation: move-aurora-1 25s ease-in-out infinite alternate;
}
.aurora-shape.shape-2 {
  width: 500px;
  height: 500px;
  background: #2775CA; /* USDC Blue */
  top: 100px;
  right: -200px;
  animation: move-aurora-2 20s ease-in-out infinite alternate;
}
.aurora-shape.shape-3 {
  width: 400px;
  height: 400px;
  background: #627EEA; /* ETH Purple */
  bottom: -150px;
  left: 30%;
  animation: move-aurora-3 18s ease-in-out infinite alternate;
}

@keyframes move-aurora-1 {
  from { transform: translate(0, 0) rotate(0deg); }
  to { transform: translate(200px, 100px) rotate(45deg); }
}
@keyframes move-aurora-2 {
  from { transform: translate(0, 0) rotate(0deg); }
  to { transform: translate(-150px, -100px) rotate(-30deg); }
}
@keyframes move-aurora-3 {
  from { transform: translate(0, 0) rotate(0deg); }
  to { transform: translate(100px, 50px) rotate(60deg); }
}


/* ---
RE-ACTIVATED NAVBAR STYLES
--- */
.landing-container .main-header {
  display: flex;
  align-items: center;
  background-color: transparent; /* --- CHANGED --- */
  backdrop-filter: none; /* --- CHANGED --- */
  -webkit-backdrop-filter: none; /* --- CHANGED --- */
  border-bottom: 1px solid transparent; 
  position: fixed; 
  top: 0;
  left: 0;
  right: 0;
  animation: fadeIn 1s ease-out;
  z-index: 2000;
  padding: 1.5rem 2.5rem 1rem 2.5rem;
  justify-content: space-between; 
}

.landing-container .main-header .logo {
  flex-shrink: 0;
}

/* .landing-nav styles are not needed */

.landing-container .launch-button {
  font-family: var(--font-main);
  background: var(--accent);
  color: var(--bg-darkest);
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  border-radius: var(--radius-small);
  padding: 0.6rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 15px rgba(39, 192, 122, 0);
  flex-shrink: 0;
  width: auto;
}
.launch-button:hover {
  background-color: var(--accent-dark);
  box-shadow: var(--shadow-accent);
  transform: translateY(-2px);
}
.launch-button:active {
  transform: scale(0.95);
}
.launch-button:disabled {
  background: var(--bg-lighter);
  color: var(--text-tertiary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  background-image: none;
}


.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6rem 2rem 6rem 2rem;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  min-height: 100vh;
}

.hero-section::before { /* Background grain overlay */
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAlklEQVR42mP4//8/AyUYhqAiGP1P0kxzcAABhgKkGKaB0gDkGCA1kGYk2kP1I60HSR1kNwEkyQZIMgCSDRBkAATpBkgxYJgNEIUBsBwgxYBhNEAUkO9AnB6kPkA2A0kxAClgEAkG0SCYmwhSgJjFiBkw4WdYfgMVAwYgB7gMNSBTQGw6kMgB5LhBcl4GAAQYAKmJ09s/b+m6AAAAAElFTkSuQmCC");
  opacity: 0.02;
  pointer-events: none;
  z-index: 1;
}

.hero-section > * {
  z-index: 2; /* Ensure content is above overlay */
}

.hero-section h1 {
  font-size: 3.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0 0 1.5rem 0;
  max-width: 800px;
  letter-spacing: -1.5px;
}
.hero-section h1 strong {
  color: var(--accent);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 2.5rem 0;
  max-width: 600px;
}
.hero-subtitle strong {
  color: var(--text-primary);
}

/* --- HERO BUTTON FIX --- */
.hero-section .hero-button {
  /* Inherit from button-primary-connect */
  font-family: var(--font-main);
  background-color: var(--accent);
  background-image: linear-gradient(to right, var(--accent) 0%, #30db8a 100%);
  color: #000;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: var(--radius-small);
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  width: auto; /* --- Allow button to size to content --- */
  transition: all 0.2s ease;
  margin-top: 0.5rem;
  box-shadow: 0 4px 15px -5px var(--accent-glow);
  /* Specific overrides for hero */
  font-size: 1.1rem;
  padding: 1rem 2rem;
}
.hero-button:hover {
  opacity: 0.9;
  box-shadow: 0 6px 20px -5px var(--accent-glow);
  transform: translateY(-2px);
}
.hero-button:active {
  transform: scale(0.98);
  opacity: 1;
}
.hero-button:disabled {
  background: var(--bg-lighter);
  color: var(--text-tertiary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  background-image: none;
}


.hero-demo-note {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-tertiary);
}

/* --- NEW Coin Ticker --- */
.coin-ticker-container {
  width: 100%;
  max-width: 900px;
  position: absolute;
  bottom: 4rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
.coin-ticker-container p {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}
.coin-ticker-track {
  width: 100%;
  overflow: hidden;
  position: relative;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}
.coin-ticker-track {
  display: flex;
  width: max-content;
  animation: scroll-ticker 30s linear infinite;
}
.coin-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.5rem;
}
.coin-logo span {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
}

@keyframes scroll-ticker {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}


/* ---
New Landing Page Sections
--- */
.section-title {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem auto;
}
.section-title h2 {
  font-size: 2.75rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  letter-spacing: -1px;
  color: var(--text-primary); /* --- ADDED THIS LINE TO FIX DARK HEADING --- */
}
.section-title p {
  font-size: 1.15rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.features-section,
.how-it-works-section,
.roadmap-section {
  padding: 6rem 2rem;
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--bg-lightest);
  background: var(--bg-dark);
}
.how-it-works-section {
  background: var(--bg-darkest);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background-color: var(--bg-light);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  background-image: radial-gradient(circle at top left, var(--accent-faded), transparent 30%);
}
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border-color: var(--accent);
}

.feature-icon {
  color: var(--accent);
  margin-bottom: 1.5rem;
  background: var(--accent-faded);
  padding: 0.75rem;
  border-radius: var(--radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
}

.feature-card p {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}
.feature-card strong {
  color: var(--text-primary);
  font-weight: 500;
}


/* --- NEW How It Works Diagram --- */
.how-it-works-diagram {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}
.diagram-node {
  flex: 1;
  background: var(--bg-light);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius);
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.diagram-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--bg-dark);
  border: 1px solid var(--bg-lightest);
  margin-bottom: 0.5rem;
}
.diagram-icon svg {
  width: 24px;
  height: 24px;
}
.diagram-node strong {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}
.diagram-node p {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.diagram-arrow {
  flex: 0.5;
  text-align: center;
  margin-top: 3.5rem; /* Align with icon center */
}
.diagram-pulse {
  animation: pulse-dash 2s linear infinite;
}
@keyframes pulse-dash {
  to {
    stroke-dashoffset: -16;
  }
}

.diagram-result {
  width: 100%;
  margin-top: 2rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent);
}


/* --- NEW Roadmap Section --- */
.roadmap-section {
  padding-bottom: 8rem;
}
.roadmap-container {
  display: flex;
  position: relative;
  margin: 4rem auto 0 auto;
  max-width: 1200px; /* --- WIDENED CONTAINER FOR 5 ITEMS --- */
}
/* Roadmap line */
.roadmap-container::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 50px;
  right: 50px;
  height: 2px;
  background-color: var(--bg-lightest);
}
.roadmap-item {
  flex: 1;
  text-align: left;
  padding: 0 2rem;
  position: relative;
}
.roadmap-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--bg-lightest);
  border: 3px solid var(--bg-darkest);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  z-index: 1;
}
.roadmap-item.done .roadmap-dot,
.roadmap-item.next .roadmap-dot {
  background-color: var(--accent);
  border-color: var(--bg-darkest);
  box-shadow: var(--shadow-accent);
}
.roadmap-item.next .roadmap-dot::after {
  content: '';
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

.roadmap-item h4 {
  margin: 2.5rem 0 0.75rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}
.roadmap-item p {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}
.roadmap-item.done h4 {
  color: var(--accent);
}


/* --- NEW Faucet Toolkit Section --- */
.faucet-section {
  padding: 6rem 2rem;
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--bg-lightest);
  background: var(--bg-darkest); /* Match 'How It Works' section */
}

.faucet-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 columns */
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.faucet-card {
  background-color: var(--bg-light);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center; /* Center content */
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.faucet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border-color: var(--accent);
}

.faucet-number {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent);
  border: 2px solid var(--bg-lightest);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.faucet-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.faucet-card p {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 2rem 0;
  flex-grow: 1; /* Makes cards equal height */
}

.toolkit-button-link {
  width: 100%; /* Make buttons full width of card */
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.75rem 1rem;
}

.landing-footer {
  padding: 3rem 2rem;
  text-align: center;
  border-top: 1px solid var(--bg-lightest);
  background: var(--bg-dark);
  z-index: 2;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.landing-footer p {
  font-size: 0.9rem;
  color: var(--text-tertiary);
  margin: 0;
}


/* ---
Main Dashboard Layout
--- */
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--bg-dark); /* Darker header */
  border-bottom: 1px solid var(--bg-lightest);
  box-sizing: border-box;
  width: 100%;
  height: 65px; /* Fixed header height */
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.wallet-button {
  font-family: var(--font-main);
  background-color: var(--bg-light);
  color: var(--text-secondary);
  border: 1px solid var(--bg-lightest);
  padding: 0.6rem 1rem;
  border-radius: var(--radius-small);
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.wallet-button:hover {
  background-color: var(--bg-lighter);
  color: var(--text-primary);
  border-color: var(--bg-lightest);
}

.main-content {
  display: flex;
  flex-grow: 1;
  height: calc(100vh - 65px); 
}

/* ---
Sidebars (Left & Right)
--- */
.sidebar-left,
.sidebar-right {
  width: 280px;
  flex-shrink: 0;
  padding: 1.5rem;
  box-sizing: border-box;
  background-color: var(--bg-dark); /* Darker sidebar */
  border-right: 1px solid var(--bg-lightest);
  overflow-y: auto;
  height: 100%; /* Fill the height */
}

.sidebar-right {
  border-right: none;
  border-left: 1px solid var(--bg-lightest);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
  padding-left: 0.75rem;
}

.sidebar-left nav {
  margin-bottom: 2rem;
}

.sidebar-left ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-button {
  font-family: var(--font-main);
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-small);
  padding: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.nav-button svg {
  color: var(--text-tertiary);
  transition: color 0.2s ease;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.nav-button:hover {
  background-color: var(--bg-light);
  color: var(--text-primary);
}
.nav-button:hover svg {
  color: var(--text-secondary);
}

.nav-button.active {
  background-color: var(--accent-faded);
  color: var(--accent);
  font-weight: 600;
}
.nav-button.active svg {
  color: var(--accent);
}

.nav-button-disabled {
  font-family: var(--font-main);
  background-color: transparent;
  color: var(--text-tertiary);
  border: none;
  border-radius: var(--radius-small);
  padding: 0.75rem;
  font-weight: 500;
  font-size: 0.95rem;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  opacity: 0.5;
  cursor: not-allowed;
}

.info-box {
  background-color: var(--bg-light);
  padding: 1.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--bg-lightest);
  text-align: left;
}
.info-box h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 600;
}
.info-box p,
.info-box ol {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  padding-left: 1.25rem; /* For ol */
}
.info-box p {
  padding-left: 0;
}
.info-box li {
  margin-bottom: 0.5rem;
}
.info-box li:last-child {
  margin-bottom: 0;
}

/* ---
NEW Testnet Toolkit
--- */
.testnet-toolkit p {
  margin-bottom: 1rem;
}
.toolkit-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.toolkit-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

/* ---
Center Content (The App)
--- */
.center-content {
  flex-grow: 1;
  padding: 2rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  height: 100%; /* Fill the height */
  box-sizing: border-box;
  background: var(--bg-darkest);
}

.balance-card {
  background-color: var(--bg-light);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin-bottom: 2rem;
  box-sizing: border-box;
  text-align: left;
}
.balance-card h2 {
  margin: 0.25rem 0 0 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
}
.card-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.app-card {
  background-color: var(--bg-light);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
  text-align: left;
  overflow: hidden; /* To contain tab content */
  box-shadow: var(--shadow-dark);
}

.app-card-tabs {
  display: flex;
  background-color: var(--bg-dark); /* Darker tab bar */
  border-bottom: 1px solid var(--bg-lightest);
}
.app-card-tabs button {
  font-family: var(--font-main);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
  margin-bottom: -1px; /* Overlap border */
  flex: 1;
}
.app-card-tabs button:hover {
  color: var(--text-primary);
}
.app-card-tabs button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.status-bar {
  background-color: var(--bg-dark);
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--bg-lightest);
}

.app-card-content {
  padding: 1.5rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.app-card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

/* ---
New Custom Token Selector
--- */
.token-selector-custom {
  position: relative;
  width: 100%;
}
.token-selector-custom label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  display: block;
  text-align: left;
}

.token-selector-button {
  font-family: var(--font-main);
  display: flex;
  align-items: center;
  width: 100%;
  background-color: var(--bg-dark);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius-small);
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  box-sizing: border-box;
}
.token-selector-button:hover {
  border-color: var(--bg-lightest);
  background-color: var(--bg-lighter);
}
.token-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 0.75rem;
}
.dropdown-arrow {
  margin-left: auto;
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.token-dropdown {
  position: absolute;
  top: calc(100% + 8px); /* 100% + gap */
  left: 0;
  width: 100%;
  background-color: var(--bg-light);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius-small);
  box-shadow: var(--shadow-dark);
  z-index: 100;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}

.token-option {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.token-option:not(:last-child) {
  border-bottom: 1px solid var(--bg-lightest);
}
.token-option:hover {
  background-color: var(--bg-lighter);
}


/* ---
Form Elements (Inputs, Labels, Buttons)
--- */
.app-card-content label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: -0.5rem; /* Reduce gap */
}

input[type="text"],
input[type="number"] {
  font-family: var(--font-main);
  background-color: var(--bg-dark);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius-small);
  padding: 0.85rem 1rem;
  font-size: 1rem;
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

input[type="text"]:read-only {
  background-color: var(--bg-darkest);
  color: var(--text-secondary);
  border-color: var(--bg-dark);
}

.label-with-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: -0.5rem;
}
.button-link {
  font-family: var(--font-main);
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 500;
}
.button-link:hover {
  text-decoration: underline;
}

.button-primary,
.button-primary-connect {
  font-family: var(--font-main);
  background-color: var(--accent);
  background-image: linear-gradient(to right, var(--accent) 0%, #30db8a 100%);
  color: #000;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: var(--radius-small);
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
  box-shadow: 0 4px 15px -5px var(--accent-glow);
}
.button-primary:hover,
.button-primary-connect:hover {
  opacity: 0.9;
  box-shadow: 0 6px 20px -5px var(--accent-glow);
  transform: translateY(-2px);
}
.button-primary:active,
.button-primary-connect:active {
  transform: scale(0.98);
  opacity: 1;
}
.button-primary:disabled {
  background: var(--bg-lighter);
  color: var(--text-tertiary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  background-image: none;
}

.button-secondary {
  font-family: var(--font-main);
  background-color: var(--bg-light);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.9rem;
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius-small);
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.button-secondary:hover {
  background-color: var(--bg-lighter);
  color: var(--text-primary);
  border-color: var(--bg-lightest);
  transform: translateY(-1px);
}

/* ---
Secret Display Box
--- */
.secret-display-box {
  background-color: var(--bg-darkest);
  border: 1px solid var(--bg-lightest);
  border-radius: var(--radius-small);
  padding: 1rem 1.25rem;
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.secret-display-box strong {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
.secret-copy-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.secret-copy-wrapper input {
  flex-grow: 1;
  margin-bottom: 0;
  font-size: 0.9rem;
  background-color: var(--bg-dark);
}
.secret-copy-wrapper .button-secondary {
  flex-shrink: 0;
  padding: 0.75rem 1rem; /* Match input height */
  font-size: 0.9rem;
  background-color: var(--bg-dark);
  margin-top: 0;
}
.secret-copy-wrapper .button-secondary:hover {
  background-color: var(--bg-lighter);
}


/* ---
Spinner
--- */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-tertiary);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---
Animations
--- */
.animate-fade-in-down {
  opacity: 0;
  transform: translateY(-20px);
  animation: fadeInDown 0.8s ease-out forwards;
}
.animate-fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes fadeInDown {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}


/* ---
Responsive Design
--- */

@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: 1fr; /* Stack features */
  }
  .how-it-works-diagram {
    flex-direction: column;
    gap: 2rem;
  }
  .diagram-arrow {
    transform: rotate(90deg);
    margin: 0;
  }
  .roadmap-container {
    flex-direction: column;
    gap: 2rem;
  }
  .roadmap-container::before {
    left: 10px;
    top: 50px;
    bottom: 50px;
    width: 2px;
    height: auto;
  }
  .roadmap-item {
    padding: 0 0 0 2rem;
  }
  .roadmap-dot {
    left: 0;
    transform: translateX(0);
  }
  .sidebar-left, .sidebar-right {
    display: none; /* Hide sidebars on tablet */
  }
  .center-content {
    padding: 1.5rem;
  }
  .faucet-grid {
  grid-template-columns: repeat(2, 1fr); /* 2x2 grid on tablets */
 }
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2.5rem;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
  .section-title h2 {
    font-size: 2rem;
  }
  .landing-nav {
    display: none; /* Hide nav on mobile */
  }
  .landing-container .main-header,
  .main-header {
    padding: 1rem;
  }
  .landing-footer {
    flex-direction: column;
    gap: 1rem;
  }
  .coin-ticker-container {
    bottom: 1rem;
  }
  .coin-logo span {
    display: none; /* Hide text on mobile */
  }
  .faucet-grid {
  grid-template-columns: 1fr; /* 1 column on mobile */
  }
}
    `}</style>
  );
};


// --- CONFIGURATION ---

// Deployed Contract Addresses on Arbitrum Sepolia
const tssContractAddress = "0x0aec55244a6b5AEF9Db1Aa1E15E1b8807Df3226c";
const privacyPoolContractAddress = "0x0BeC794081343E35e7BE7c294Ac40a0Fa48A0321";
const usdcContractAddress = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; 

const correctNetwork = {
  chainId: "0x66eee", // 421614 (Arbitrum Sepolia)
  chainName: "Arbitrum Sepolia",
  nativeCurrency: { name: "Arbitrum Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
};

// --- SVG ICONS ---

// Note: In a real app, these would be separate .svg files, but for a single-file build,
// we define them as React components.

const TssLogo = ({ width = 28, height = 28 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20V20H4V4Z" fill="var(--bg-light)" stroke="var(--accent)" strokeWidth="2"/>
    <path d="M8 9H16" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12H16" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 15H12" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UsdcIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#2775CA"/>
    <path d="M12.62 17.656C11.32 17.656 10.22 17.376 9.32 16.816C8.42 16.256 7.78 15.436 7.4 14.356L9.2 13.636C9.44 14.356 9.88 14.896 10.52 15.256C11.16 15.616 11.86 15.796 12.62 15.796C13.44 15.796 14.08 15.636 14.54 15.316C15 14.996 15.23 14.566 15.23 14.026C15.23 13.486 15.01 13.066 14.57 12.766C14.13 12.466 13.49 12.226 12.65 12.046C11.81 11.866 11.09 11.606 10.49 11.266C9.89 10.926 9.47 10.456 9.23 9.856C8.99 9.256 8.87 8.576 8.87 7.816C8.87 7.036 9.1 6.366 9.56 5.806C10.02 5.246 10.68 4.846 11.54 4.606L11.54 3H13.28V4.576C14.36 4.786 15.2 5.176 15.8 5.746C16.4 6.316 16.7 7.006 16.7 7.816L14.96 7.816C14.96 7.226 14.76 6.776 14.36 6.466C13.96 6.156 13.43 6 12.77 6C12.01 6 11.41 6.16 10.97 6.48C10.53 6.8 10.31 7.22 10.31 7.74C10.31 8.24 10.5 8.63 10.88 8.91C11.26 9.19 11.84 9.43 12.62 9.61C13.46 9.79 14.17 10.05 14.75 10.39C15.33 10.73 15.75 11.19 16.01 11.77C16.27 12.35 16.4 13.01 16.4 13.75C16.4 14.65 16.14 15.42 15.62 16.06C15.1 16.7 14.37 17.16 13.43 17.44V18.91H11.69V17.476C11.21 17.576 10.73 17.626 10.25 17.626C10.01 17.626 9.77 17.626 9.53 17.626L10.25 17.656H12.62Z" fill="white"/>
  </svg>
);

const UsdtIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#26A17B"/>
    <path d="M12.33 16.5H16.5V14.25H14.58V11.16H16.5V8.91H14.58V7.5H12.33V8.91H10.08V11.16H12.33V14.25H10.08V16.5H12.33Z" fill="white"/>
    <path d="M7.5 11.16H9.42V8.91H7.5V11.16Z" fill="white"/>
    <path d="M17.16 11.16H19.08V8.91H17.16V11.16Z" fill="white" opacity="0.5"/>
  </svg>
);

const EthIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#627EEA"/>
    <path d="M12.0229 3.01172L11.9121 3.32205V14.9354L12.0229 15.011L17.5147 11.9687L12.0229 3.01172Z" fill="white" fillOpacity="0.6"/>
    <path d="M12.0229 3.01172L6.53125 11.9687L12.0229 15.011V7.93551V3.01172Z" fill="white"/>
    <path d="M12.0229 16.033L11.9546 16.1136V20.8931L12.0229 21.0117L17.5186 12.9905L12.0229 16.033Z" fill="white" fillOpacity="0.6"/>
    <path d="M12.0229 21.0117V16.033L6.53125 12.9905L12.0229 21.0117Z" fill="white"/>
    <path d="M12.0229 15.011L17.5147 11.9687L12.0229 7.93551V15.011Z" fill="white" fillOpacity="0.2"/>
    <path d="M6.53125 11.9687L12.0229 15.011V7.93551L6.53125 11.9687Z" fill="white" fillOpacity="0.6"/>
  </svg>
);

const ArbIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#2D374B"/>
    <path d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4V20Z" fill="#21A7F9"/>
    <path d="M12 11.5312L17 8.76562L11.5 6L12 11.5312Z" fill="white"/>
    <path d="M12 11.5312L11.5 6L6 8.76562L12 11.5312Z" fill="#96BEDC"/>
    <path d="M12 12.4687L17 15.2344L12 18V12.4687Z" fill="white"/>
    <path d="M12 12.4687L6 15.2344L12 18V12.4687Z" fill="#96BEDC"/>
  </svg>
);

const SolIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="black"/>
    <path d="M5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12Z" fill="url(#sol-gradient)"/>
    <path d="M16.49 7.00001C16.22 7.00001 16 7.22001 16 7.49001V8.49001C16 8.76001 16.22 8.98001 16.49 8.98001H17.49C17.76 8.98001 17.98 8.76001 17.98 8.49001V7.49001C17.98 7.22001 17.76 7.00001 17.49 7.00001H16.49Z" fill="#00FFA3"/>
    <path d="M6.02 15.02C5.75 15.02 5.53 15.24 5.53 15.51V16.51C5.53 16.78 5.75 17 6.02 17H7.02C7.29 17 7.51 16.78 7.51 16.51V15.51C7.51 15.24 7.29 15.02 7.02 15.02H6.02Z" fill="#00FFA3"/>
    <path d="M6.02 7.00001C5.75 7.00001 5.53 7.22001 5.53 7.49001V8.49001C5.53 8.76001 5.75 8.98001 6.02 8.98001H7.02C7.29 8.98001 7.51 8.76001 7.51 8.49001V7.49001C7.51 7.22001 7.29 7.00001 7.02 7.00001H6.02Z" fill="white" fillOpacity="0.5"/>
    <defs>
      <linearGradient id="sol-gradient" x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00FFA3"/>
        <stop offset="1" stopColor="#DC1FFF"/>
      </linearGradient>
    </defs>
  </svg>
);

const FeatureIcon1 = () => ( // Selective Disclosure
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5C7.5 4.5 3.737 7.252 2 11.5C3.737 15.748 7.5 18.5 12 18.5C16.5 18.5 20.263 15.748 22 11.5C20.263 7.252 16.5 4.5 12 4.5Z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14.5C13.6569 14.5 15 13.1569 15 11.5C15 9.84315 13.6569 8.5 12 8.5C10.3431 8.5 9 9.84315 9 11.5C9 13.1569 10.3431 14.5 12 14.5Z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 11.5H5" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 11.5H22" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FeatureIcon2 = () => ( // Compliance-Ready
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12L11 14L15 10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6V3" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21V18" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 12H21" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 12H6" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FeatureIcon3 = () => ( // Multi-Chain
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12H16" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const HowItWorksIcons = {
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Box: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 6V20" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 6V20" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 11H21" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Secret: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18V12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 16H14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  OffChain: () => (
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2L11 13" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

// Define supported tokens with SVG icons
const supportedTokens = {
  TSS: { 
    address: tssContractAddress, 
    symbol: 'TSS', 
    decimals: 18, 
    abi: TSSABI,
    icon: ( <TssLogo width={24} height={24} /> )
  },
  USDC: { 
    address: usdcContractAddress, 
    symbol: 'USDC', 
    decimals: 6, 
    abi: TSSABI, // Using standard ERC20 ABI (TSSABI is also standard ERC20)
    icon: ( <UsdcIcon /> )
  },
};

// --- CUSTOM TOKEN SELECTOR COMPONENT ---
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

// --- NEW TESTNET TOOLKIT COMPONENT ---
const TestnetToolkit = ({ onAddNetwork }) => (
  <div className="info-box testnet-toolkit"> 
    <h4>TESTNET TOOLKIT</h4> 
    <p>Resources to get you started on Arbitrum Sepolia.</p>
    <div className="toolkit-buttons">
      <button className="button-secondary toolkit-button" onClick={onAddNetwork}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Add Arbitrum Sepolia
      </button>
      <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer" className="button-secondary toolkit-button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Get Sepolia ETH
      </a>
      <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="button-secondary toolkit-button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Get Demo USDC
      </a>
    </div>
    <p>Admin? Go to the "Mint" tab to create test TSS tokens.</p>
  </div>
);


const MainApp = ({
  walletAddress,
  isTssOwner,
  balances,
  selectedTokenSymbol,
  setSelectedTokenSymbol,
  handleRefresh,
  handleDisconnect,
  tssContract,
  privacyPoolContract,
  provider,
  onAddNetwork
}) => {
  const [activeTab, setActiveTab] = useState(isTssOwner ? "mint" : "send");
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
    // Use window.ethers
    if (window.ethers.utils.isHexString(secret) && secret.length === 34) {
      try {
        return window.ethers.utils.solidityKeccak256(["bytes16"], [secret]);
      } catch (e) { console.error("Error hashing bytes16:", e); return null; }
    } else {
      console.warn("Secret not bytes16 hex, hashing as string.");
      return window.ethers.utils.solidityKeccak256(["string"], [secret]);
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
    if (!tssContract || !mintAmount) return;
    setStatus("Status: Minting TSS...");
    try {
      const amount = window.ethers.utils.parseUnits(mintAmount, supportedTokens.TSS.decimals);
      const transaction = await tssContract.mint(walletAddress, amount);
      await transaction.wait();
      setStatus("Status: TSS Mint successful! Refreshing balances...");
      await handleRefresh();
      setMintAmount("");
    } catch (err) { console.error("Error minting TSS: ", err); setStatus("Error: TSS Minting failed."); }
  };

  const handleBurn = async () => {
    // Burn only works for TSS contract
    if (!tssContract || !burnAmount) return;
    setStatus("Status: Burning TSS...");
    try {
      const amount = window.ethers.utils.parseUnits(burnAmount, supportedTokens.TSS.decimals);
      const transaction = await tssContract.burn(amount);
      await transaction.wait();
      setStatus("Status: TSS Burn successful! Refreshing balances...");
      await handleRefresh();
      setBurnAmount("");
    } catch (err) { console.error("Error burning TSS: ", err); setStatus("Error: TSS Burning failed."); }
  };

  const handleSend = async () => {
    if (!privacyPoolContract || !sendAmount || !selectedToken || !provider) return;
    setStatus(`Status: Generating secure ${selectedTokenSymbol} note...`);
    setGeneratedSecret(""); setCopyStatus("Copy");

    try {
      const newSecret = window.ethers.utils.hexlify(window.ethers.utils.randomBytes(16));
      setGeneratedSecret(newSecret);
      const secretHash = getSecretHash(newSecret);
      if (!secretHash) {
         setStatus("Error: Failed to generate secret hash.");
         return;
      }
      console.log(`SENDING ${selectedTokenSymbol} - Secret:`, newSecret, "Hash:", secretHash);

      const amount = window.ethers.utils.parseUnits(sendAmount, selectedToken.decimals);
      const signer = await provider.getSigner();
      const tokenContract = new window.ethers.Contract(selectedToken.address, selectedToken.abi, signer);

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
    if (!window.ethers.utils.isAddress(redeemRecipient)) return setStatus("Status: Invalid recipient address.");

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
        return ( <div className="app-card-content"> <h3 className="app-card-title">Mint New Tokens (Admin Only)</h3> <p className="card-subtitle">Create new TSS utility tokens.</p> <label>Amount to Mint (TSS)</label> <input type="number" placeholder="e.g., 1000" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} /> <button className="button-primary" onClick={handleMint} disabled={!mintAmount || parseFloat(mintAmount) <= 0 || status.includes("...")}> {status.includes("...") ? "Minting..." : "Mint Tokens"} </button> </div> );
      case "burn":
        return ( <div className="app-card-content"> <h3 className="app-card-title">Burn Tokens (Admin Only)</h3> <p className="card-subtitle">Destroy TSS tokens from your balance.</p> <label>Amount to Burn (TSS)</label> <input type="number" placeholder="e.g., 100" value={burnAmount} onChange={e => setBurnAmount(e.target.value)} /> <button className="button-primary" onClick={handleBurn} disabled={!burnAmount || parseFloat(burnAmount) <= 0 || status.includes("...")}> {status.includes("...") ? "Burning..." : "Burn Tokens"} </button> </div> );
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
          <nav className="sidebar-section"> <p className="sidebar-title">INTEL (COMING SOON)</p> <ul> <li><button className="nav-button-disabled">Studio</button></li> <li><button className="nav-button-disabled">AlphaScan</button></li> </ul> </nav> 
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
          {/* --- NEW TOOLKIT ADDED HERE --- */}
          <TestnetToolkit onAddNetwork={onAddNetwork} />
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
// This is the new, professional landing page.

const CoinTicker = () => (
  <div className="coin-ticker-container">
    <p>Privacy for Any Asset</p>
    <div className="coin-ticker-track">
      <div className="coin-logo"><TssLogo width={24} height={24} /><span>TSS</span></div>
      <div className="coin-logo"><UsdcIcon /><span>USDC</span></div>
      <div className="coin-logo"><UsdtIcon /><span>USDT</span></div>
      <div className="coin-logo"><EthIcon /><span>ETH</span></div>
      <div className="coin-logo"><ArbIcon /><span>ARB</span></div>
      <div className="coin-logo"><SolIcon /><span>SOL</span></div>
      {/* Duplicate for seamless scroll */}
      <div className="coin-logo"><TssLogo width={24} height={24} /><span>TSS</span></div>
      <div className="coin-logo"><UsdcIcon /><span>USDC</span></div>
      <div className="coin-logo"><UsdtIcon /><span>USDT</span></div>
      <div className="coin-logo"><EthIcon /><span>ETH</span></div>
      <div className="coin-logo"><ArbIcon /><span>ARB</span></div>
      <div className="coin-logo"><SolIcon /><span>SOL</span></div>
    </div>
  </div>
);

const HowItWorksDiagram = () => (
  // --- UPDATED: Removed diagram-result from here ---
  <div className="how-it-works-diagram">
    <div className="diagram-node">
      <div className="diagram-icon"><HowItWorksIcons.User /></div>
      <strong>1. Deposit Funds</strong>
      <p>Sender (Agent A) deposits TSS, USDC, or other tokens into the privacy pool.</p>
    </div>
    
    <div className="diagram-arrow">
      <svg width="100%" height="24" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 12 L100 12" stroke="var(--bg-lightest)" strokeWidth="2" strokeDasharray="4 4"/>
        <path className="diagram-pulse" d="M0 12 L100 12" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4"/>
      </svg>
    </div>

    <div className="diagram-node">
      <div className="diagram-icon"><HowItWorksIcons.Box /></div>
      <strong>2. Generate Secret Note</strong>
      <p>The contract generates a cryptographic secret note. This note is sent <strong>off-chain</strong> (e.g., via Signal) to the receiver.</p>
    </div>

    <div className="diagram-arrow">
       <svg width="100%" height="24" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 12 L100 12" stroke="var(--bg-lightest)" strokeWidth="2" strokeDasharray="4 4"/>
        <path className="diagram-pulse" d="M0 12 L100 12" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" style={{animationDelay: '1s'}}/>
      </svg>
    </div>

    <div className="diagram-node">
      <div className="diagram-icon"><HowItWorksIcons.User /></div>
      <strong>3. Redeem Funds</strong>
      <p>Receiver (Agent B) uses the secret note on the "Receive" tab to withdraw the funds to a fresh wallet.</p>
    </div>
  </div>
);


const LandingPage = ({ handleConnect, isEthersReady, onAddNetwork }) => ( 
  <div className="landing-container">
    {/* Animated background shapes */}
    <div className="aurora-background">
      <div className="aurora-shape shape-1"></div>
      <div className="aurora-shape shape-2"></div>
      <div className="aurora-shape shape-3"></div>
    </div>

   <header className="main-header landing-header"> 
      <div className="logo"> 
        <TssLogo />
        The Secret Service
      </div> 
      {/* Navigation links removed as requested */}
      <button 
        className="button-primary-connect launch-button" 
        onClick={handleConnect} 
        disabled={!isEthersReady}
      >
        {isEthersReady ? "Launch App" : "Loading Library..."}
      </button> 
    </header>
 
    <section className="hero-section">
      <h1 className="animate-fade-in-down">Privacy is a Right. <br /> Not a Feature.</h1>
      <p className="hero-subtitle animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
        TSS is a next-generation <strong>privacy platform</strong>, not a mixer.
        <br />
        We provide compliant, selective disclosure for your digital assets.
      </p>
      <button 
        className="button-primary-connect hero-button animate-fade-in-up" 
        onClick={handleConnect}
        disabled={!isEthersReady}
      >
        {isEthersReady ? "Launch App & Connect Wallet" : "Loading Library..."}
      </button>
      <p className="hero-demo-note animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        This is a public demo running on the Arbitrum Sepolia testnet.
      </p>
      <CoinTicker />
    </section>

    <section className="features-section" id="features">
      <div className="section-title">
        <h2>The Future of On-Chain Privacy</h2>
        <p>We are building the tools for a private, compliant, and multi-chain world.</p>
      </div>
      <div className="features-grid">
        <div className="feature-card animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="feature-icon"><FeatureIcon1 /></div>
          <h3>Selective Disclosure</h3>
          <p>Our future ZK-powered protocol will allow users to choose what they reveal. Prove facts about your funds (e.g., source) to meet AML laws without revealing your entire transaction history. Privacy and compliance can coexist.</p>
        </div>
        <div className="feature-card animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="feature-icon"><FeatureIcon2 /></div>
          <h3>A Platform, Not a Mixer</h3>
          <p>We are engineering a system for financial privacy, not illicit activity. By building in "selective disclosure" from day one, we are creating a protocol that can be trusted by institutions, users, and regulators alike.</p>
        </div>
        <div className="feature-card animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
          <div className="feature-icon"><FeatureIcon3 /></div>
          <h3>Any Asset, Any Chain</h3>
          <p>Our vision is chain-agnostic. The TSS privacy protocol is designed to provide a secure wrapper for any digital asset, from EVM chains like <strong>Ethereum & Arbitrum</strong> to non-EVM chains like <strong>Solana</strong>.</p>
        </div>
      </div>
    </section>

    {/* --- UPDATED SECTION --- */}
    <section className="how-it-works-section" id="how-it-works">
       <div className="section-title">
        <h2>How The MVP Works</h2>
        <p>Our current hash-based protocol breaks the on-chain link in 3 simple steps.</p>
      </div>
      <HowItWorksDiagram />
      {/* --- MOVED THIS DIV OUTSIDE THE DIAGRAM COMPONENT FOR CORRECT LAYOUT --- */}
      <div className="diagram-result">
        <strong>MISSION COMPLETE:</strong> The on-chain link between Agent A and Agent B is broken.
      </div>
    </section>

    {/* --- NEW FAUCET TOOLKIT SECTION --- */}
    <section className="faucet-section" id="faucets">
      <div className="section-title">
        <h2>Testnet Toolkit</h2>
        <p>Get the testnet tokens you need to try the protocol.</p>
      </div>
      <div className="faucet-grid">
        <div className="faucet-card">
          <div className="faucet-number">1</div>
          <h3>Get Sepolia ETH</h3>
          <p>You'll need Sepolia ETH (on L1) to bridge for gas on Arbitrum.</p>
          <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer" className="button-primary-connect toolkit-button-link">
            Request ETH
          </a>
        </div>
        <div className="faucet-card">
          <div className="faucet-number">2</div>
          <h3>Bridge to Arbitrum</h3>
          <p>Use the official Arbitrum bridge to move your Sepolia ETH to Arbitrum Sepolia.</p>
          <a href="https://portal.arbitrum.io/bridge" target="_blank" rel="noopener noreferrer" className="button-primary-connect toolkit-button-link">
            Open Bridge
          </a>
        </div>
        <div className="faucet-card">
          <div className="faucet-number">3</div>
          <h3>Add Network</h3>
          <p>Add the Arbitrum Sepolia network to your wallet using Chainlist.</p>
          <a href="https://chainlist.wtf/chain/421614/" target="_blank" rel="noopener noreferrer" className="button-primary-connect toolkit-button-link">
            Add Arbitrum Sepolia
          </a>
        </div>
        <div className="faucet-card">
          <div className="faucet-number">4</div>
          <h3>Get Demo USDC</h3>
          <p>Get test USDC tokens directly on Arbitrum Sepolia from the Circle faucet.</p>
          <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="button-primary-connect toolkit-button-link">
            Request USDC
          </a>
        </div>
      </div>
    </section>

    <section className="roadmap-section" id="roadmap">
      <div className="section-title">
        <h2>Project Roadmap</h2>
        <p>Our MVP is complete. We are now focused on building the next generation of on-chain privacy.</p>
      </div>
      <div className="roadmap-container">
        <div className="roadmap-item done">
          <div className="roadmap-dot"></div>
          <h4>V1: Core Protocol (Complete)</h4>
          <p>Secure, hash-based privacy pool deployed on Arbitrum Sepolia. Supports TSS and USDC.</p>
        </div>
        <div className="roadmap-item next">
          <div className="roadmap-dot"></div>
          <h4>V2: TSS Token Utility</h4>
          <p>Integrate the TSS token to be used for paying protocol fees, governance, and rewarding anonymity providers.</p>
        </div>
        <div className="roadmap-item">
          <div className="roadmap-dot"></div>
          <h4>V3: ZK-SNARK Integration</h4>
          <p>Migrate the core protocol from a hash-based system to a full Zero-Knowledge Proof (zk-SNARK) model for ultimate, provable "selective disclosure."</p>
        </div>

        {/* --- NEW ROADMAP ITEM 4 --- */}
        <div className="roadmap-item">
          <div className="roadmap-dot"></div>
          <h4>V4: Solana & Multi-Chain</h4>
          <p>Expand the protocol beyond EVM to non-EVM chains, starting with a native Solana integration to achieve a truly multi-chain privacy solution.</p>
        </div>

        {/* --- NEW ROADMAP ITEM 5 --- */}
        <div className="roadmap-item">
          <div className="roadmap-dot"></div>
          <h4>V5: Fiat On/Off-Ramp</h4>
          <p>Integrate a seamless fiat on-ramp and off-ramp wallet, allowing users to move from cash to private crypto and back, all in one platform.</p>
        </div>

      </div>
    </section>

    <footer className="landing-footer">
      <div className="logo"> 
        <TssLogo />
        The Secret Service (TSS) Protocol
      </div>

      {/* --- NEW LINKS ADDED HERE --- */}
      <div className="footer-links" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
        <Link to="/privacy" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          Privacy Policy
        </Link>
        <Link to="/terms" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          Terms of Service
        </Link>
      </div>
      {/* --- END OF NEW LINKS --- */}

      <p>© 2025 The Secret Service Protocol. This is a public demo project for demonstration purposes only.</p>
    </footer>

  </div> 
);

// ... (This is after the end of your LandingPage component)

// --- NEW PRIVACY POLICY PAGE ---
const PrivacyPolicy = () => {
  // Basic styling to make it readable
  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '800px',
      margin: '4rem auto 0 auto', // Add margin-top to clear the header
      lineHeight: '1.6',
      textAlign: 'left',
      color: 'var(--text-primary)', // Use theme color
    },
    heading: {
      marginBottom: '20px',
    },
    subheading: {
      marginTop: '30px',
      marginBottom: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Privacy Policy</h1>
      <p><strong>Last Updated:</strong> November 11, 2025</p>

      <h2 style={styles.subheading}>1. Introduction</h2>
      <p>
        Welcome to The Secret Service ("TSS", "we", "us", "our"). Our service,
        thesecretservice.io, is a platform for private transactions.
      </p>
      <p>
        This service is owned and operated by{' '}
        <strong>Global Region Research Consultants FZC</strong>.
      </p>
      <p>
        This Privacy Policy explains how we collect, use, and disclose
        information about you when you access our website and use our services.
      </p>

      <h2 style={styles.subheading}>2. Information We Collect</h2>
      <p>
        We are committed to privacy. Our service is designed to minimize the
        collection of personal data.
      </p>
      <ul>
        <li>
          <strong>Blockchain Data:</strong> Our service operates on public
          blockchains (like Arbitrum Sepolia). We do not collect or store your
          private keys. Any transactions you make are public and permanently
          recorded on the blockchain. This public data includes your wallet
          address and transaction history.
        </li>
        <li>
          <strong>Non-Personal Data:</strong> When you visit our website, we (or
          our third-party service providers like Vercel) may collect
          industry-standard log data, such as your IP address (anonymized where
          possible), browser type, operating system, and pages visited. This is
          used for analytics and to improve our service.
        </li>
      </ul>

      <h2 style={styles.subheading}>3. How We Use Information</h2>
      <p>We use the limited information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services.</li>
        <li>Monitor website analytics and usage.</li>
        <li>Protect the security and integrity of our platform.</li>
      </ul>

      <h2 style={styles.subheading}>4. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at thesecretservicetoken@gmail.com.
      </p>
    </div>
  );
};

// --- NEW TERMS OF SERVICE PAGE (CORRECTED) ---
const TermsOfService = () => {
  // Basic styling
  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '800px',
      margin: '4rem auto 0 auto', // Add margin-top
      lineHeight: '1.6',
      textAlign: 'left',
      color: 'var(--text-primary)', // Use theme color
    },
    heading: {
      marginBottom: '20px',
    },
    subheading: {
      marginTop: '30px',
      marginBottom: '10px',
    },
    warning: {
      border: '2px solid #FF0000',
      padding: '15px',
      borderRadius: '5px',
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
    backLink: {
      color: 'var(--accent)',
      textDecoration: 'none',
      fontSize: '1rem',
      fontWeight: '500',
      display: 'block',
      marginBottom: '2rem',
    }
  };

  return (
    <div style={styles.container}>
      {/* --- THIS IS THE NEW LINK --- */}
      <Link to="/" style={styles.backLink}>
        &larr; Back to Home
      </Link>

      <h1 style={styles.heading}>Terms of Service</h1>
      <p><strong>Last Updated:</strong> November 11, 2025</p>

      <h2 style={styles.subheading}>1. Agreement to Terms</h2>
      <p>
        These Terms of Service ("Terms") govern your access to and use of the
        The Secret Service ("TSS", "we", "us", "our") website
        (thesecretservice.io) and its related services. This service is owned
        and operated by{' '}
        <strong>Global Region Research Consultants FZC</strong>.
      </p>
      <p>
        By accessing or using our service, you agree to be bound by these
        Terms.
      </p>

      <div style={styles.warning}>
        <h2 style={styles.subheading}>
          2. ⚠️ IMPORTANT: TESTNET AND EXPERIMENTAL SERVICE
        </h2>
        <p>
          You acknowledge and agree to the following:
        </p>
        <ul>
          <li>
            <strong>FOR TESTING ONLY:</strong> The TSS service is currently
            operating on the <strong>Arbitrum Sepolia TESTNET</strong>.
          </li>
          <li>
            <strong>NO MONETARY VALUE:</strong> Any cryptocurrency tokens
            used with this service (such as Sepolia ETH or test USDC) are
            <strong>TESTNET TOKEN'S</strong>. They have{' '}
            <strong>NO MONETARY VALUE</strong> and cannot be sold,
            transferred for value, or redeemed for any real-world currency.
          </li>
          <li>
            <strong>EXPERIMENTAL SOFTWARE:</strong> The protocol is
            experimental and provided for testing purposes only. You use this
            service at your own risk.
          </li>
        </ul>
      </div>

      <h2 style={styles.subheading}>3. Service Provided "As-Is"</h2>
      <p>
        The TSS service is provided on an "AS IS" and "AS AVAILABLE" basis,
        without warranties of any kind. We do not guarantee that the service
        will be secure, uninterrupted, or error-free.
      </p> {/* <--- THIS WAS THE LINE WITH THE </f> TYPO. IT'S NOW FIXED. */}

      <h2 style={styles.subheading}>4. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Global Region Research
        Consultants FZC shall not be liable for any damages, including loss of
        funds, loss of profits, or data loss, arising from your use of (or
        inability to use) the service.
      </p>

      <h2 style={styles.subheading}>5. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at
        thesecretservicetoken@gmail.com.
      </p>
    </div>
  );
};

      
// --- MAIN APP COMPONENT (CONTROLLER) ---
function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [provider, setProvider] = useState(null);
  const [isTssOwner, setIsTssOwner] = useState(false);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState('TSS');
  const [balances, setBalances] = useState({});
  const [tssContract, setTssContract] = useState(null);
  const [privacyPoolContract, setPrivacyPoolContract] = useState(null);
  const [isEthersReady, setIsEthersReady] = useState(false); // NEW state to track script loading

  // NEW: Dynamically load ethers.js from CDN
  useEffect(() => {
    const script = document.createElement('script');
    // Use the UMD (Universal Module Definition) build, which safely creates the window.ethers object
    script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
    script.async = true;
    script.onload = () => {
      console.log('Ethers.js loaded from CDN');
      setIsEthersReady(true); // Set state to true once loaded
    };
    script.onerror = () => {
      console.error('Failed to load Ethers.js from CDN');
      alert('Failed to load critical library. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      // Clean up the script tag if the component unmounts
      document.body.removeChild(script);
    };
  }, []); // Empty dependency array, so this runs only once on mount

  // Provider now depends on the script being ready
  const memoizedProvider = useMemo(() => {
    if (isEthersReady && window.ethereum && window.ethers) {
      return new window.ethers.providers.Web3Provider(window.ethereum);
    }
    return null;
  }, [isEthersReady]); // Re-run this when isEthersReady changes

  useEffect(() => {
    const initContracts = async () => {
      if (memoizedProvider && walletAddress && window.ethers) {
        try {
            const signer = await memoizedProvider.getSigner();
            setTssContract(new window.ethers.Contract(tssContractAddress, TSSABI, signer));
            setPrivacyPoolContract(new window.ethers.Contract(privacyPoolContractAddress, PrivacyPoolABI, signer));
        } catch (error) {
            console.error("Error initializing contracts:", error);
            setTssContract(null);
            setPrivacyPoolContract(null);
        }
      } else {
        setTssContract(null);
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
    setIsTssOwner(false);
    setSelectedTokenSymbol('TSS');
  }, []);

  const fetchBalance = useCallback(async (tokenSymbol, providerInstance, account) => {
    const token = supportedTokens[tokenSymbol];
    if (!token || !providerInstance || !account || !window.ethers) return "0";
    try {
      const tokenContract = new window.ethers.Contract(token.address, token.abi, providerInstance);
      const balanceBigInt = await tokenContract.balanceOf(account);
      return window.ethers.utils.formatUnits(balanceBigInt, token.decimals);
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

  const fetchTssOwner = useCallback(async (account) => {
    console.log("Fetching TSS owner...");
    if (memoizedProvider && account && window.ethers) {
        try {
            // Use provider for read-only call
            const tempTssContract = new window.ethers.Contract(tssContractAddress, TSSABI, memoizedProvider);
            const ownerAddress = await tempTssContract.owner();
            console.log("Contract owner:", ownerAddress);
            const isOwner = account.toLowerCase() === ownerAddress.toLowerCase();
            setIsTssOwner(isOwner);
            console.log("Is connected account owner?", isOwner);
        } catch (err) { 
            console.error("Error fetching TSS owner: ", err);
            setIsTssOwner(false);
        }
    } else {
        console.log("Cannot fetch owner - provider or account missing.");
        setIsTssOwner(false);
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
   
  // --- NEW: Handle Add Network ---
  const handleAddNetwork = useCallback(async () => {
    if (!memoizedProvider) return alert("Wallet provider not found.");
    try {
      await window.ethereum.request({ 
        method: 'wallet_addEthereumChain', 
        params: [correctNetwork] 
      });
    } catch (addError) {
      console.error("Failed to add network:", addError);
    }
  }, [memoizedProvider]);


  const handleConnect = useCallback(async () => {
    console.log("handleConnect called");
    // Add check for ethers readiness
    if (!isEthersReady) {
      alert('Libraries are still loading, please try again in a moment.');
      return;
    }
    if (memoizedProvider && window.ethers) {
        try {
        console.log("Checking network...");
        const onCorrectNetwork = await checkNetwork(memoizedProvider);
        if (!onCorrectNetwork) return alert("Please switch to Arbitrum Sepolia.");
        console.log("Network OK.");

        console.log("Requesting accounts...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = window.ethers.utils.getAddress(accounts[0]);
        console.log("Account:", account);

        setWalletAddress(account);
        setProvider(memoizedProvider); 

        // Manually trigger fetches after state is set
        await fetchAllBalances(memoizedProvider, account);
        await fetchTssOwner(account);

        console.log("Connection successful.");
        } catch (err) { 
          console.error("Connect wallet err: ", err); 
          handleDisconnect();
        }
    } else { alert('Wallet not detected.'); }
  }, [isEthersReady, memoizedProvider, checkNetwork, fetchAllBalances, fetchTssOwner, handleDisconnect]);


  const handleRefresh = useCallback(() => {
     console.log("Refreshing balances...");
     if (provider && walletAddress) {
        fetchAllBalances(provider, walletAddress);
     }
  }, [provider, walletAddress, fetchAllBalances]);


  // Effect for account/network changes
  useEffect(() => {
    const { ethereum } = window;
    if (ethereum?.on && window.ethers) { // Also check for window.ethers
      const handleAccountsChanged = (accounts) => {
          console.log("Accounts changed:", accounts);
          const newAccount = accounts.length > 0 ? window.ethers.utils.getAddress(accounts[0]) : null;
          const oldAccount = walletAddress ? window.ethers.utils.getAddress(walletAddress) : null;
          
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
  }, [walletAddress, handleConnect, handleDisconnect, isEthersReady]); // Add isEthersReady dependency


  // --- RENDER ---
  return (
    <BrowserRouter> {/* 1. Wrap everything in BrowserRouter */}
      <div className="App">
        <InjectedStyles />
        
        <Routes> {/* 2. Define your routes */}
          
          {/* This is your MAIN route ("/") */}
          <Route path="/" element={
            !walletAddress ? (
              <LandingPage 
                handleConnect={handleConnect} 
                isEthersReady={isEthersReady}
                onAddNetwork={handleAddNetwork}
              />
            ) : (
              <MainApp
                walletAddress={walletAddress}
                isTssOwner={isTssOwner}
                balances={balances}
                selectedTokenSymbol={selectedTokenSymbol}
                setSelectedTokenSymbol={setSelectedTokenSymbol}
                handleRefresh={handleRefresh}
                handleDisconnect={handleDisconnect}
                tssContract={tssContract}
                privacyPoolContract={privacyPoolContract}
                provider={provider}
                onAddNetwork={handleAddNetwork}
              />
            )
          } />

          {/* 3. Add your new page routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

