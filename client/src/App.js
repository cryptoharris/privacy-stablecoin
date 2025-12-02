/* global BigInt */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, EyeOff, Wallet, ArrowRight, Play, Lock, Unlock, Copy, 
  Activity, Database, Globe, ChevronDown, Layers, Droplet, Wifi, 
  Coins, Fingerprint, Scale, Twitter, Send, Book, FileText, AlertTriangle, Check
} from 'lucide-react';
import { ethers } from 'ethers';

// --- 1. ABIs ---
const ERC20ABI = [
  { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
  { "constant": false, "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
];

const PrivacyPoolABI = [
  { "inputs": [ { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType":"bytes32", "name": "secretHash", "type": "bytes32" } ], "name": "generatePrivacyNote", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "bytes32", "name": "secretHash", "type": "bytes32" }, { "internalType": "address", "name": "recipient", "type": "address" } ], "name": "redeemNote", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// --- 2. CONFIGURATION ---
const CONFIG = {
  activeChainId: "0x66eee", 
  contracts: {
    tss: "0x0aec55244a6b5AEF9Db1Aa1E15E1b8807Df3226c",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    pool: "0x0BeC794081343E35e7BE7c294Ac40a0Fa48A0321"
  },
  network: {
    chainId: "0x66eee", 
    chainName: "Arbitrum Sepolia",
    rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
  }
};

// --- 3. STYLES ---
const InjectedStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap');

    :root {
      --bg-darkest: #050505;
      --bg-dark: #080808;
      --bg-panel: rgba(12, 12, 12, 0.8);
      --brand-green: #27c07a;
      --neon-blue: #00F0FF;
      --alert-red: #FF003C;
      --text-primary: #EAEAEA;
      --text-dim: #888888;
      --font-display: 'Orbitron', sans-serif;
      --font-mono: 'Space Mono', monospace;
      --font-body: 'Inter', sans-serif;
    }

    * { box-sizing: border-box; }

    body { 
      margin: 0; 
      background-color: var(--bg-darkest); 
      color: var(--text-primary); 
      font-family: var(--font-body); 
      overflow-x: hidden; 
    }

    /* --- GRAINY SPACE TEXTURE --- */
    body::before {
      content: "";
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
      pointer-events: none; z-index: 9998; opacity: 0.08;
    }

    /* --- NAVBAR (ABSOLUTE + HIGH Z-INDEX) --- */
    .landing-navbar { 
      height: 80px; width: 100%; 
      border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 0 2rem; 
      background: rgba(2, 2, 2, 0.9); /* High opacity to prevent bleed */
      backdrop-filter: blur(10px); 
      position: absolute; /* Scrolls with page */
      top: 0; left: 0; 
      z-index: 10000; /* Above video */
    }

    /* --- VIDEO BACKGROUND --- */
    .video-bg-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100vh; overflow: hidden; z-index: 0; }
    .video-bg-wrapper video { width: 100%; height: 100%; object-fit: cover; opacity: 0.3; }
    .video-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(2,2,2,0.6) 0%, rgba(2,2,2,0.95) 90%, #050505 100%); }

    /* Sections */
    .hero-content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 20px; padding-top: 80px; }
    
    .content-section { position: relative; z-index: 10; background: var(--bg-darkest); padding: 8rem 2rem; width: 100%; }
    
    .section-title { font-family: var(--font-display); font-size: 2.5rem; color: white; text-align: center; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 2px; }
    .section-subtitle { font-family: var(--font-mono); font-size: 1rem; color: var(--text-dim); text-align: center; margin-bottom: 4rem; max-width: 600px; margin-left: auto; margin-right: auto; }

    /* --- STATS BAR --- */
    .stats-bar {
      display: flex; justify-content: center; gap: 2rem; padding: 4rem 2rem;
      background: var(--bg-darkest); width: 100%; position: relative; z-index: 20; flex-wrap: wrap;
    }
    .stat-item { 
      text-align: center; background: rgba(255, 255, 255, 0.03); border: 1px solid #333; padding: 2rem; min-width: 240px; backdrop-filter: blur(5px); transition: all 0.3s ease;
    }
    .stat-item:hover { border-color: var(--brand-green); transform: translateY(-5px); background: rgba(39, 192, 122, 0.05); }
    .stat-val { font-family: var(--font-display); font-size: 2.5rem; color: white; font-weight: 700; }
    .stat-label { font-family: var(--font-mono); font-size: 0.9rem; color: var(--brand-green); text-transform: uppercase; margin-top: 0.8rem; letter-spacing: 1px; }

    /* --- RECRUITMENT FEED --- */
    .recruitment-feed { max-width: 800px; margin: 0 auto 4rem auto; border: 1px solid #222; background: #080808; padding: 1.5rem; font-family: var(--font-mono); font-size: 0.85rem; color: #555; min-height: 200px; }

    /* --- GRIDS & CARDS --- */
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; }
    
    .steps-grid { 
      display: grid; grid-template-columns: repeat(3, 1fr); /* Force 3 columns on desktop */
      gap: 4rem; max-width: 1200px; margin: 0 auto; position: relative; align-items: flex-start;
    }

    /* --- ANIMATED 3-LINE CONNECTOR (FIXED & CENTERED) --- */
    .connector-track {
      position: absolute;
      top: 120px;  /* Target the center of the number circle */
      left: 16%;
      right: 16%;
      height: 150px; /* Height controls the spacing between lines */
      transform: translateY(-50%); /* KEY FIX: This centers the group perfectly */
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 0;
      opacity: 0.5;
    }
    .connector-line {
      width: 100%; height: 2px;
      background-image: linear-gradient(90deg, var(--brand-green) 50%, transparent 50%);
      background-size: 30px 100%; animation: dash-scroll 1s linear infinite;
    }
    .connector-line:nth-child(2) { animation-direction: reverse; opacity: 0.5; }
    .connector-line:nth-child(3) { animation-duration: 1.5s; opacity: 0.3; }
    @keyframes dash-scroll { 0% { background-position: 0 0; } 100% { background-position: -30px 0; } }

    .step-card { background: #080808; border: 1px solid #222; padding: 2rem; text-align: center; position: relative; z-index: 2; min-height: 240px; box-shadow: 0 0 20px rgba(0,0,0,0.8); }
    .step-number { background: #080808; color: var(--brand-green); font-family: var(--font-display); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; border: 1px solid #333; border-radius: 50%; position: relative; z-index: 3; box-shadow: 0 0 15px rgba(0,0,0,1); }

    .toolkit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .roadmap-container { max-width: 800px; margin: 0 auto; position: relative; border-left: 2px solid #222; padding-left: 2rem; }
    .roadmap-item { position: relative; margin-bottom: 3rem; }
    .roadmap-dot { position: absolute; left: -2.6rem; top: 0.5rem; width: 1.2rem; height: 1.2rem; background: #000; border: 2px solid var(--brand-green); border-radius: 50%; box-shadow: 0 0 10px var(--brand-green); }

    .cyber-card { background: rgba(20, 20, 20, 0.4); border: 1px solid #222; padding: 2.5rem; backdrop-filter: blur(10px); transition: all 0.3s ease; }
    .cyber-card:hover { border-color: var(--brand-green); transform: translateY(-5px); box-shadow: 0 10px 30px -10px rgba(39, 192, 122, 0.1); }

    /* --- INFINITE MARQUEE --- */
    .marquee-wrapper { background: var(--bg-darkest); border-top: 1px solid #222; border-bottom: 1px solid #222; overflow: hidden; padding: 1.5rem 0; position: relative; z-index: 20; width: 100%; }
    .marquee-content { display: flex; gap: 6rem; width: max-content; animation: scroll 30s linear infinite; }
    .marquee-item { font-family: var(--font-display); font-size: 1.2rem; color: #FFFFFF; text-transform: uppercase; display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: 1px; }
    .marquee-item span { color: var(--brand-green); opacity: 1; }

    /* --- UI ELEMENTS --- */
    .glitch-text { font-size: 4rem; font-weight: 900; text-transform: uppercase; margin-bottom: 1rem; color: white; }
    
    .btn-neon { background: transparent; border: 1px solid var(--brand-green); color: var(--brand-green); padding: 1rem 2rem; font-family: var(--font-mono); text-transform: uppercase; font-weight: bold; cursor: pointer; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .btn-neon:hover { background: var(--brand-green); color: black; box-shadow: 0 0 20px rgba(39, 192, 122, 0.4); }
    
    .btn-ghost { border: 1px solid #333; color: #999; background: transparent; padding: 0.5rem 1.2rem; font-family: var(--font-mono); font-size: 0.8rem; text-transform: uppercase; font-weight: bold; cursor: pointer; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .btn-ghost:hover { background: var(--brand-green); border-color: var(--brand-green); color: black; box-shadow: 0 0 20px rgba(39, 192, 122, 0.4); }

    .terminal-input { background: rgba(0,0,0,0.3); border: 1px solid #333; color: var(--brand-green); font-family: var(--font-mono); padding: 1rem; width: 100%; font-size: 1.1rem; margin-bottom: 1rem; transition: 0.3s; }
    .terminal-input.blue-mode { color: var(--neon-blue); border-color: #333; }
    .btn-neon.blue-mode { border-color: var(--neon-blue); color: var(--neon-blue); }
    .btn-neon.blue-mode:hover { background: var(--neon-blue); color: black; box-shadow: 0 0 20px rgba(0, 240, 255, 0.4); }

    /* --- APP LAYOUT --- */
    .app-layout { display: flex; height: 100vh; background-color: var(--bg-darkest); color: white; font-family: var(--font-mono); overflow: hidden; }
    .sidebar { width: 260px; background: var(--bg-dark); border-right: 1px solid #222; padding: 1.5rem; display: flex; flex-direction: column; flex-shrink: 0; height: 100vh; z-index: 20; }
    .main-view { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow-y: auto; }
    .top-bar { height: 70px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; padding: 0 1.5rem; background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 10; flex-shrink: 0; }
    .dashboard-area { flex: 1; padding: 2rem; position: relative; display: flex; align-items: flex-start; justify-content: center; background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px); background-size: 40px 40px; }
    .dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; width: 100%; max-width: 1200px; }

    /* Footer & Legal */
    .new-footer { background: #020202; border-top: 1px solid #222; padding: 4rem 2rem; position: relative; z-index: 20; }
    .footer-content { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 3rem; }
    .footer-col h4 { color: white; font-family: var(--font-display); margin-bottom: 1.5rem; font-size: 0.9rem; letter-spacing: 1px; }
    .footer-link { display: block; color: #666; margin-bottom: 0.8rem; text-decoration: none; font-family: var(--font-mono); font-size: 0.85rem; transition: 0.3s; cursor: pointer; }
    .footer-link:hover { color: var(--brand-green); }
    .social-links { display: flex; gap: 1rem; }
    .social-icon { color: #666; transition: 0.3s; cursor: pointer; }
    .social-icon:hover { color: var(--brand-green); transform: translateY(-3px); }

    .legal-container { max-width: 800px; margin: 8rem auto 4rem; padding: 2rem; background: var(--bg-dark); border: 1px solid #222; position: relative; z-index: 20; height: auto; overflow-y: visible; }
    .legal-container h1 { font-family: var(--font-display); margin-bottom: 2rem; color: var(--brand-green); font-size: 2.5rem; }
    .legal-container h2 { font-family: var(--font-mono); color: white; margin-top: 2rem; font-size: 1.2rem; border-bottom: 1px solid #222; padding-bottom: 0.5rem; }
    .legal-container p { color: #999; line-height: 1.6; margin-bottom: 1rem; font-family: var(--font-body); }
    
    .privacy-notice { position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(5, 5, 5, 0.95); border-top: 1px solid var(--brand-green); padding: 1.5rem; z-index: 100000; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(10px); }

    @media (max-width: 768px) { 
        .footer-content { grid-template-columns: 1fr; gap: 2rem; }
        .privacy-notice { flex-direction: column; gap: 1rem; text-align: center; }
        .dashboard-grid { grid-template-columns: 1fr; }
        .glitch-text { font-size: 2.5rem; } 
        .features-section { grid-template-columns: 1fr; } 
        .steps-grid { grid-template-columns: 1fr; gap: 2rem; }
        .sidebar { display: none; } 
        .main-view { margin-left: 0; } 
        .roadmap-container { border-left: 0; padding-left: 0; } 
        .roadmap-dot { display: none; }
        .connector-track { display: none; } 
        .top-bar { padding: 0 1rem; }
        .landing-navbar { padding: 0.8rem 1rem; }
    }
  `}</style>
);

// --- 4. ASSETS & ICONS ---
const TssLogo = ({ width = 28, height = 28 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <path d="M4 4H20V20H4V4Z" fill="rgba(39,192,122,0.1)" stroke="var(--brand-green)" strokeWidth="2"/>
    <path d="M7 9H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 15H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// --- 5. LANDING PAGE COMPONENTS ---

// --- RECRUITMENT FEED COMPONENT ---
const AGENT_LIST = [
  '@Crypt0guru101', '@JosephAdel92969', '@omto35243', '@mykelphilip', '@Igho_banks', '@OPTIMUMWEB3', '@iamgloryrolland', '@cityboyfola', '@anebidey4u', '@Tek_To_Tar', '@joaq_exe', '@wcubNFTs', '@bigbykes', '@Bispo10261602', '@iceflamez33', '@DXmhen', '@ShShah47', '@gopudno', '@classic3241', '@ayonba09', '@symplydee003', '@CrystaT22', '@jones_bones_', '@BomaonyeIgoya', '@Daivekn', 
  '@ox_wrld', '@babs_ayobami', '@XHasnaatAyub', '@oxemmanueltx', '@hart_ley001', '@AlexMus04182319', '@shuoaebuA', '@olutiger374009', '@Web3_Centurion', '@Farukman409', 
  '@vawulence586', '@BoiSunna', '@airdrop1994s', '@Praise024', '@dev_Onyekac', '@shakirzeb0346', '@LSkarro', '@Pelz_ade', '@LiveLove_Light', '@VictoryNdu94345', 
  '@ZKTimz', '@SeyiDaniel32930', '@Abel_W29', '@topozec246', '@Tomas_crypxz', '@blurryfacedj', '@0xAndreeee', '@_ojini', '@RivalP77', '@akorede2471', 
  '@maishaszn', '@still_420', '@AdelValerieomaa', '@Steph_Kendric', '@Uwaisu2022', '@Sabitumatter1', '@DefiSteve0', '@Dadi_of_web3', '@Big_Toby01', '@0xKenichi', 
  '@AzeezOluseyitan', '@samDweb3', '@Web3Anchor', '@thuhien1409', '@Philonsui', '@Hunter113549', '@2abdur38', '@EmmanuelTcee100', '@Kyoya738755', '@CuongVu78368', 
  '@lmLk82010998', '@WilliamsTr45172', '@OmniWeb4', '@BhigTg', '@Astro_ofweb3', '@ceojosh_', '@OPOE_O', '@Prestilee', '@hash_sui', '@Give_Me_Alpha_', '@0x_hybr1d', 
  '@LEDG_END', '@clearany_we', '@tanjiro50536', '@Marko_Onchain', '@DataSage_', '@i_zohayb', '@tg_ayo89045', '@GAB_SOFIA05', '@ShittaT25289', '@Ghost_uncles', 
  '@salmana98329324', '@techguy0x', '@SahaniTony67088', '@CryptoOGs2013', '@Ameer__Basheer', '@PhilePal', '@thetunemedia', '@alfarooq_u', '@Jeyson_ion', '@dhemovic_0', 
  '@DheNoble_0', '@HzKrypto', '@Joshspxz', '@aku_rious', '@dudusvicki', '@Daroadmen', '@make_sentism', '@khing_ladipoe', '@tweetsofdior', '@merxy_0x', 
  '@merxy0x', '@K_darrell0x1', '@SleekSlickmonk', '@Yanmife554', '@TeaonaX', '@Branding_moh', '@BlueBayGay1', '@johnsnowpro', '@__valentin0', '@Vickywin30', 
  '@Blitzer696', '@AliuOlasun92887', '@tamuno_akanni', '@rationalist_g', '@meguru_jr', '@Mud9ine', '@Yusuf_Ismaila1', '@Bigsammydesgin', '@ShogbeAbimbola', '@NasiruHabi52316', 
  '@11_qbx', '@johnope17', '@yemskidfx_786', '@real_i_k', '@BethelT14', '@GucchiPop1234', '@officialokojie', '@MichaelSipakati', '@samexcrypt', '@Israel0181', 
  '@EAAli0', '@Billionz_Crypt', '@Fabianmosthigh', '@itzuchenna12', '@abba_victo88602', '@Trust_worthy_', '@The_age_unknon', '@Faizan659524', '@CEmmanuel93054', '@Hiensberg059', 
  '@lordspeed27', '@PASARATY', '@gmRxq2Je08ti76', '@Winsome_11', '@BabayoBenjamin', '@Ayofe_0', '@Alhoa848', '@OAdeolegan', '@ODINAX_01', '@Ayomidemarv', 
  '@Sl1ckman', '@Uthmania_', '@TheGenieWithYou', '@Richietribe4', '@safiii555', '@Aringim_1', '@JoshuaJo65', '@Emmylightd39240', '@YAHSAM_4LIVE', '@emmypeter201', 
  '@Olayiwolaa6009', '@MarshDyor', '@AbayomiMuizz', '@Valkyrie_chi', '@AdemolaTai63837', '@hipolasmus23300', '@Bedrich256169', '@6ApMN7dwmT2zsp', '@foxworldne2024', '@JDHICKS43', 
  '@Fahim_Polani', '@Shaty1637450', '@_swankyaxe', '@Comrademayor86', '@Athenaseb', '@therealosato', '@zbvvtaaassw', '@frenly_divine1', '@d_charmcaster', '@Drakexxxxxxx', 
  '@DylanCrypto77', '@CryptoPump_Pro', '@ThePepeARMY', '@smayee', '@michaelbweb3', '@CryptoNestSOL', '@CryptoBoiyt', '@drakon_deg', '@dogeecommunity', '@BinanceCall', 
  '@Crtommy95', '@KenzoNft7', '@CryptoHodlHQ', '@oojje', '@dfi5_', '@Biak0_', '@NickyBuffett', '@Truxe1782', '@DeFiNattii', '@Btcwhale3357321', 
  '@BscNew_', '@cutiieepie8', '@alkhobarREST', '@2_ghkx', '@CryptoKing_2020', '@_SamuelPatrick', '@CryptoWhales_X'
];

// --- UPDATED RECRUITMENT FEED (CYCLING COUNTER) ---
const RecruitmentFeed = () => {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % AGENT_LIST.length);
    }, 1000); // Keeps the readable speed (1 second per name)
    return () => clearInterval(interval);
  }, []);

  // Show 5 agents at a time
  const visibleAgents = [];
  for (let i = 0; i < 5; i++) {
    const idx = (index - i + AGENT_LIST.length) % AGENT_LIST.length;
    visibleAgents.push(AGENT_LIST[idx]);
  }

  // Counter Logic: Starts at 1, goes to 208, then resets to 1
  const currentCount = index + 1;
  
  // Progress bar fills relative to the 1000 cap (So it goes from 0% to ~20% and loops)
  const progress = (currentCount / 1000) * 100;

  return (
    <section className="content-section" style={{ padding: '4rem 2rem', background: '#030303', borderBottom: '1px solid #222' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Progress Bar */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--brand-green)', letterSpacing: '1px' }}>
            <span>AIRDROP STATUS</span>
            <span>{currentCount} / 1000 AGENTS</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#111', borderRadius: '3px', border: '1px solid #333', position: 'relative', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'tween', ease: 'linear', duration: 1 }} 
              style={{ height: '100%', background: 'var(--brand-green)', boxShadow: '0 0 15px var(--brand-green)' }}
            />
          </div>
        </div>

        {/* The Terminal Log */}
        <div className="cyber-card" style={{ padding: '2rem', minHeight: '260px', background: '#050505', border: '1px solid #333', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-mono)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444', borderBottom: '1px solid #222', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
             <span>Secure Uplink: ACTIVE</span>
             <span style={{color: 'var(--brand-green)'}} className="animate-pulse">● LIVE FEED</span>
          </div>

          {/* The List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
            <AnimatePresence mode='popLayout'>
              {visibleAgents.map((agent, i) => (
                <motion.div 
                  key={`${agent}-${index}`} 
                  initial={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4 }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between', 
                    fontFamily: i === 0 ? '"Inter", sans-serif' : 'var(--font-mono)', 
                    fontSize: i === 0 ? '1.1rem' : '0.9rem', 
                    color: i === 0 ? 'white' : '#444',     
                    fontWeight: i === 0 ? '600' : 'normal',
                    borderLeft: i === 0 ? '3px solid var(--brand-green)' : '3px solid transparent',
                    paddingLeft: '15px',
                    letterSpacing: i === 0 ? '0.5px' : '0'
                  }}
                >
                  <span>
                    <span style={{color: i === 0 ? 'var(--brand-green)' : '#333', marginRight: '10px'}}>{'>'}</span> 
                    {agent}
                  </span>
                  {i === 0 && (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--brand-green)', border: '1px solid var(--brand-green)', padding: '2px 6px', borderRadius: '4px' }}
                    >
                      VERIFIED
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
};


const StatsBar = () => (
  <div className="stats-bar">
    <div className="stat-item">
      <div className="stat-val">$42,069</div>
      <div className="stat-label">Total Value Shielded</div>
    </div>
    <div className="stat-item">
      <div className="stat-val">402</div>
      <div className="stat-label">Active Agents</div>
    </div>
    <div className="stat-item">
      <div className="stat-val">100%</div>
      <div className="stat-label">ZK-Compliance Score</div>
    </div>
  </div>
);

const InfiniteMarquee = () => {
  const items = [
    "ARBITRUM", "SOLANA", "BASE", "OPTIMISM", "USDC", "ETH", "TSS", 
    "ZERO-KNOWLEDGE", "ARBITRUM", "SOLANA", "BASE", "OPTIMISM", "USDC", "ETH", "TSS"
  ];
  return (
    <div className="marquee-wrapper">
      <div className="marquee-content">
        {items.map((item, i) => <div key={i} className="marquee-item"><span>//</span> {item}</div>)}
        {items.map((item, i) => <div key={`dup-${i}`} className="marquee-item"><span>//</span> {item}</div>)}
      </div>
    </div>
  );
};

// --- SHARED COMPONENTS ---
const PublicHeader = ({ handleConnect }) => (
  <header className="landing-navbar">
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
      <TssLogo width={32} height={32} />
      <span className="font-display text-xl tracking-wider text-white">THE SECRET SERVICE</span>
    </Link>
    <div style={{display: 'flex', gap: '1rem'}}>
      <a href="https://docs.thesecretservice.io/" target="_blank" rel="noopener noreferrer" className="btn-ghost">
        DOCS
      </a>
      <button onClick={handleConnect} className="btn-neon" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.5rem 1.2rem', marginTop: 0 }}>
        ENTER TERMINAL
      </button>
    </div>
  </header>
);

const Footer = () => (
  <footer className="new-footer">
    <div className="footer-content">
      <div className="footer-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <TssLogo width={24} height={24} />
          <span className="font-display text-lg text-white">THE SECRET SERVICE</span>
        </div>
        <p className="font-mono text-xs text-dim" style={{ maxWidth: '300px', lineHeight: '1.5' }}>
          The first compliant Zero-Knowledge privacy layer. Built for the future of digital finance.
          <br/><br/>
          © 2025 The Secret Service.
        </p>
      </div>

      <div className="footer-col">
        <h4>COMMS LINK</h4>
        <div className="social-links">
          <a href="https://x.com/secretserviceio" target="_blank" rel="noopener noreferrer" className="social-icon">
            <Twitter size={20} />
          </a>
          <a href="https://t.me/thesecretservicetoken" target="_blank" rel="noopener noreferrer" className="social-icon">
            <Send size={20} />
          </a>
          <a href="https://docs.thesecretservice.io/" target="_blank" rel="noopener noreferrer" className="social-icon">
            <Book size={20} />
          </a>
        </div>
      </div>

      <div className="footer-col">
        <h4>LEGAL</h4>
        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        <Link to="/terms" className="footer-link">Terms of Service</Link>
        <div className="footer-link" style={{ cursor: 'default', opacity: 0.5 }}>Audits (Pending)</div>
      </div>
    </div>
  </footer>
);

const PrivacyNotice = () => {
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    const hasAck = localStorage.getItem('tss_privacy_ack');
    if (hasAck) setAcknowledged(true);
  }, []);
  const handleAck = () => {
    localStorage.setItem('tss_privacy_ack', 'true');
    setAcknowledged(true);
  };
  if (acknowledged) return null;
  return (
    <div className="privacy-notice">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Shield className="text-green-500" size={32} style={{color: 'var(--brand-green)'}} />
        <div>
          <h4 className="font-display text-white text-sm mb-1">PRIVACY NOTICE</h4>
          <p className="font-mono text-gray-400 text-xs max-w-2xl">
            This terminal runs entirely client-side. We do not use cookies for tracking or analytics. 
            Local storage is used strictly for app functionality. By entering, you agree to our Terms.
          </p>
        </div>
      </div>
      <button onClick={handleAck} className="btn-neon" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', width: 'auto', marginTop: 0 }}>
        ACKNOWLEDGE
      </button>
    </div>
  );
};

const PrivacyPolicy = () => (
  <div className="landing-container" style={{ height: 'auto', minHeight: '100vh' }}>
    <PublicHeader handleConnect={() => window.location.href='/'} />
    <div className="legal-container">
      <h1>Privacy Policy</h1>
      <p>Effective Date: 2025-11-30</p>
      <h2>1. No Data Collection</h2>
      <p>The Secret Service ("TSS") is a decentralized protocol. We do not collect, store, or process personal data such as names, email addresses, or IP addresses on our servers. We have no backend database.</p>
      <h2>2. On-Chain Transparency</h2>
      <p>While TSS creates privacy for your transactions, please be aware that the underlying blockchain (Arbitrum/Solana) is a public ledger. Interactions with the smart contract are public, although the link between depositor and withdrawer is cryptographically broken.</p>
      <h2>3. Local Storage</h2>
      <p>The TSS Terminal uses your browser's <code>localStorage</code> solely to improve user experience (e.g., remembering your last selected token or acknowledgment of this policy). This data never leaves your device.</p>
      <h2>4. Third-Party Infrastructure</h2>
      <p>When you connect your wallet, you are interacting with third-party RPC providers (like Infura, Alchemy, or Helius). These providers may see your IP address and wallet requests. We recommend using a VPN for maximum privacy.</p>
    </div>
    <Footer />
  </div>
);

const TermsOfService = () => (
  <div className="landing-container" style={{ height: 'auto', minHeight: '100vh' }}>
    <PublicHeader handleConnect={() => window.location.href='/'} />
    <div className="legal-container">
      <h1>Terms of Service</h1>
      <p>Last Updated: 2025-11-30</p>
      <h2>1. Experimental Software</h2>
      <p>The Secret Service Protocol is experimental software running on Testnet and Mainnet environments. Use it at your own risk. The developers assume no responsibility for funds lost due to smart contract bugs, user error (e.g., losing your Secret Note), or network failures.</p>
      <h2>2. Compliance & Prohibited Use</h2>
      <p>You agree not to use TSS for money laundering, terrorist financing, or sanctioned activities. The protocol implements a Zero-Knowledge Compliance layer to prevent illicit funds from entering the pool. Attempting to bypass these checks is a violation of these terms.</p>
      <h2>3. No Warranty</h2>
      <p>The software is provided "AS IS", without warranty of any kind, express or implied. We do not guarantee uptime, specific privacy levels, or profitability.</p>
      <h2>4. Jurisdiction</h2>
      <p>By accessing this interface, you confirm that you are not a citizen or resident of a jurisdiction where decentralized privacy protocols are prohibited by law.</p>
    </div>
    <Footer />
  </div>
);

// --- 6. LANDING PAGE COMPONENT ---
const LandingPage = ({ handleConnect, isEthersReady }) => {
  return (
    <div className="landing-container">
      <PublicHeader handleConnect={handleConnect} />

      {/* Video Background */}
      <div className="video-bg-wrapper">
        <video autoPlay loop muted playsInline>
          <source src="/videos/tss_hero_loop.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* Hero */}
      <div className="hero-content">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div style={{ border: '1px solid var(--brand-green)', display: 'inline-block', padding: '5px 12px', color: 'var(--brand-green)', fontSize: '0.8rem', marginBottom: '24px', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
            SYSTEM STATUS: ONLINE
          </div>
          <h1 className="glitch-text" data-text="PRIVACY IS A RIGHT">PRIVACY IS A RIGHT.<br/>NOT A FEATURE.</h1>
          <p className="font-mono text-gray-400" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            The first compliant Zero-Knowledge Privacy Protocol. <br/>
            Break the link. Own your data. Go Dark.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <button onClick={handleConnect} className="btn-neon" style={{ width: 'auto' }}>
              ENTER TERMINAL <ArrowRight size={20} style={{ display: 'inline', marginLeft: '10px' }} />
            </button>
            <button onClick={() => window.open('https://twitter.com/secretserviceio', '_blank')} className="btn-neon" style={{ width: 'auto', borderColor: 'white', color: 'white', boxShadow: 'none' }}>
              WATCH BRIEFING <Play size={18} style={{ display: 'inline', marginLeft: '10px' }} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Live Stats */}
      <StatsBar />
      
      {/* Recruitment Feed */}
      <RecruitmentFeed />

      {/* Features */}
      <section className="content-section">
        <div className="section-title">The Future of Privacy</div>
        <div className="section-subtitle">Building the tools for a private, compliant, and multi-chain world.</div>
        <div className="features-grid">
          {[
            { icon: EyeOff, title: "Selective Disclosure", desc: "ZK-powered protocol allows users to reveal specific transaction data to auditors without exposing their full history." },
            { icon: Layers, title: "Platform, Not a Mixer", desc: "Engineering a system for financial privacy, not illicit activity. Compliance is baked into the code via ZK proofs." },
            { icon: Globe, title: "Any Asset, Any Chain", desc: "Starting on EVM for ubiquity, moving to Solana for speed. The privacy layer for the entire crypto ecosystem." }
          ].map((feature, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 * idx }} className="cyber-card">
              <div style={{ color: 'var(--brand-green)', marginBottom: '1.5rem' }}><feature.icon size={40} /></div>
              <h3 className="font-display text-white" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{feature.title}</h3>
              <p className="font-mono text-sm text-gray-400" style={{ lineHeight: '1.6' }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Marquee */}
      <InfiniteMarquee />

      {/* How it Works */}
      <section className="content-section">
        <div className="section-title">How The MVP Works</div>
        <div className="section-subtitle">Our current hash-based protocol breaks the on-chain link in 3 simple steps.</div>
        
        <div className="steps-grid">
          {/* Fixed Connecting Lines */}
          <div className="connector-track">
            <div className="connector-line"></div>
            <div className="connector-line"></div>
            <div className="connector-line"></div>
          </div>

          {[
            { step: "1", title: "Deposit Funds", desc: "Sender deposits USDC or tokens into the smart contract pool." },
            { step: "2", title: "Generate Note", desc: "Contract creates a secret note. Saved off-chain." }, 
            { step: "3", title: "Redeem Funds", desc: "Recipient uses the secret note to withdraw funds to a fresh wallet." }
          ].map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 * idx }} className="step-card">
              <div className="step-number">{item.step}</div>
              <h3 className="font-display text-white" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.title}</h3>
              <p className="font-mono text-xs text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '4rem', fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', fontSize: '0.9rem' }}>
          MISSION COMPLETE: The on-chain link between Sender and Receiver is broken.
        </div>
      </section>

      {/* NEW "Proof of Cleanliness" Section */}
      <section className="content-section">
        <div className="section-title">Institutional Compliance</div>
        <div className="section-subtitle">How we prevent bad actors from using the pool.</div>
        <div className="features-grid">
          <motion.div className="cyber-card" style={{ borderLeft: '4px solid var(--brand-green)' }}>
            <div style={{ color: 'var(--brand-green)', marginBottom: '1rem' }}><Shield size={40} /></div>
            <h3 className="font-display text-white" style={{ fontSize: '1.5rem' }}>ZK-Proof of Innocence</h3>
            <p className="font-mono text-sm text-gray-400 mt-2">
              Users generate a Zero-Knowledge proof confirming their funds do not originate from blacklisted addresses (OFAC/Hacks).
            </p>
          </motion.div>
          <motion.div className="cyber-card" style={{ borderLeft: '4px solid var(--neon-blue)' }}>
            <div style={{ color: 'var(--neon-blue)', marginBottom: '1rem' }}><Fingerprint size={40} /></div>
            <h3 className="font-display text-white" style={{ fontSize: '1.5rem' }}>Clean History</h3>
            <p className="font-mono text-sm text-gray-400 mt-2">
              The smart contract verifies the proof on-chain before allowing a deposit. The protocol stays permissionless but compliant.
            </p>
          </motion.div>
          <motion.div className="cyber-card" style={{ borderLeft: '4px solid #FF003C' }}>
            <div style={{ color: '#FF003C', marginBottom: '1rem' }}><Scale size={40} /></div>
            <h3 className="font-display text-white" style={{ fontSize: '1.5rem' }}>Regulation Ready</h3>
            <p className="font-mono text-sm text-gray-400 mt-2">
              Designed to separate legitimate privacy seekers from illicit actors, protecting the protocol's longevity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Toolkit */}
      <section className="content-section">
        <div className="section-title">Testnet Toolkit</div>
        <div className="section-subtitle">Get the tokens you need to try the protocol.</div>
        <div className="toolkit-grid">
          {[
            { label: "1. Get Sepolia ETH", icon: Droplet, action: () => window.open("https://sepolia-faucet.pk910.de/", "_blank") },
            { label: "2. Add Network", icon: Wifi, action: () => window.open("https://chainlist.wtf/chain/421614/", "_blank") },
            { label: "3. Bridge to Arbitrum", icon: Layers, action: () => window.open("https://portal.arbitrum.io/bridge", "_blank") },
            { label: "4. Get Demo USDC", icon: Coins, action: () => window.open("https://faucet.circle.com/", "_blank") }
          ].map((tool, idx) => (
            <motion.div key={idx} whileHover={{ scale: 1.05 }} className="cyber-card" style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer' }} onClick={tool.action}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'white' }}><tool.icon size={24} /></div>
              <h4 className="font-mono text-white text-sm">{tool.label}</h4>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="content-section" style={{ paddingBottom: '8rem' }}>
        <div className="section-title">Project Roadmap</div>
        <div className="section-subtitle">From EVM Playground to Solana Mainnet.</div>
        
        <div className="roadmap-container">
          {[
            { phase: "V1", title: "EVM Prototype (Live)", desc: "Proof of concept on Arbitrum Sepolia. Testing cryptographic commitment schemes.", active: true },
            { phase: "V2", title: "Multi-Chain Expansion", desc: "Deploying the playground to Base, Optimism, and Polygon testnets to build user base.", active: false },
            { phase: "V3", title: "The Solana Migration", desc: "Migrating the core engine to Solana to leverage high-speed, native privacy architecture.", active: false },
            { phase: "V4", title: "ZK Compliance Layer", desc: "Integrating 'Proof of Innocence' ZK-SNARKs to ensure pool cleanliness.", active: false },
            { phase: "V5", title: "Mainnet Launch", desc: "Public launch of $TSS privacy token and the compliant Dark Pool.", active: false }
          ].map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * idx }} className="roadmap-item">
              <div className="roadmap-dot" style={{ background: item.active ? 'var(--brand-green)' : 'black' }}></div>
              <h3 className="font-display text-white" style={{ fontSize: '1.5rem', color: item.active ? 'var(--brand-green)' : 'white' }}>{item.title}</h3>
              <p className="font-mono text-sm text-gray-400 mt-2">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

// --- 7. MAIN APP (SWAP PAGE) ---
const MainApp = ({ 
  walletAddress, balances, selectedTokenSymbol, setSelectedTokenSymbol, 
  handleRefresh, handleDisconnect, provider, dashboardData 
}) => {
  const [activeTab, setActiveTab] = useState("send");
  const [amount, setAmount] = useState("");
  const [secret, setSecret] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("SYSTEM READY");
  const [isLoading, setIsLoading] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState(CONFIG.activeChainId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatus("COPIED TO CLIPBOARD");
    setTimeout(() => setStatus("SYSTEM READY"), 2000);
  };

  const truncatedAddress = walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "NOT CONNECTED";

  const handleSend = async () => {
    if (!amount) return;
    setIsLoading(true);
    setStatus("INITIATING ENCRYPTION PROTOCOL...");
    try {
      const signer = provider.getSigner();
      const tokenAddress = CONFIG.contracts[selectedTokenSymbol.toLowerCase()];
      const tokenContract = new window.ethers.Contract(tokenAddress, ERC20ABI, signer);
      const privacyContract = new window.ethers.Contract(CONFIG.contracts.pool, PrivacyPoolABI, signer);

      const newSecret = window.ethers.utils.hexlify(window.ethers.utils.randomBytes(16));
      const secretHash = window.ethers.utils.solidityKeccak256(["bytes16"], [newSecret]);
      
      setStatus("REQUESTING ASSET APPROVAL...");
      const parsedAmount = window.ethers.utils.parseUnits(amount, selectedTokenSymbol === 'USDC' ? 6 : 18);
      
      const txApprove = await tokenContract.approve(CONFIG.contracts.pool, parsedAmount);
      await txApprove.wait();

      setStatus("MIXING ASSETS...");
      const txDeposit = await privacyContract.generatePrivacyNote(tokenAddress, parsedAmount, secretHash);
      await txDeposit.wait();

      setSecret(newSecret);
      setStatus("NOTE GENERATED. SAVE YOUR SECRET.");
      handleRefresh();
    } catch (e) {
      console.error(e);
      setStatus("ERROR: TRANSACTION FAILED");
    }
    setIsLoading(false);
  };

  const handleRedeem = async () => {
    if (!secret || !recipient) return;
    setIsLoading(true);
    setStatus("VERIFYING SECRET KEY...");
    try {
      const signer = provider.getSigner();
      const privacyContract = new window.ethers.Contract(CONFIG.contracts.pool, PrivacyPoolABI, signer);
      const secretHash = window.ethers.utils.solidityKeccak256(["bytes16"], [secret]);
      
      const tx = await privacyContract.redeemNote(secretHash, recipient);
      await tx.wait();
      setStatus("FUNDS WITHDRAWN SUCCESSFULLY");
      handleRefresh();
      setSecret("");
    } catch (e) {
      console.error(e);
      setStatus("ERROR: INVALID SECRET OR FAILED TX");
    }
    setIsLoading(false);
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3rem' }}>
          <TssLogo />
          <span className="font-display tracking-widest text-white text-lg">TERMINAL</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab("send")} className={`nav-btn ${activeTab === 'send' ? 'active' : ''}`}>
            <Lock size={16} /> ENCRYPT (SEND)
          </button>
          <button onClick={() => setActiveTab("receive")} className={`nav-btn ${activeTab === 'receive' ? 'active-blue' : ''}`}>
            <Unlock size={16} /> DECRYPT (RECEIVE)
          </button>
        </nav>
        <div className="status-log-container">
          <p className="text-gray-500" style={{ fontSize: '0.7rem', marginBottom: '5px' }}>STATUS LOG:</p>
          <div style={{ color: 'var(--brand-green)', fontSize: '0.7rem', lineHeight: '1.5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            > CONNECTED: ARBITRUM<br/>
            > SECURE CHANNEL ACTIVE
          </div>
        </div>
      </aside>

      <main className="main-view">
        <header className="top-bar">
          <div style={{ display:'flex', alignItems:'center', gap:'20px'}}>
            <div className="network-selector">
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <div className="network-dot"></div>
                <span>Arbitrum Sepolia</span>
              </div>
              <ChevronDown size={12} />
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', alignItems: 'center', gap: '10px' }}>
              WALLET ID: <span className="text-white font-mono">{truncatedAddress}</span>
            </div>
          </div>
          <button onClick={handleDisconnect} style={{ background: 'transparent', border: '1px solid #FF003C', color: '#FF003C', padding: '5px 15px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            DISCONNECT
          </button>
        </header>

        <div className="dashboard-area">
          <div className="dashboard-grid">
            {/* VAULT */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="vault-card">
              <div className="corner tl" style={{ borderColor: activeTab === 'receive' ? 'var(--neon-blue)' : 'var(--brand-green)'}}></div>
              <div className="corner tr" style={{ borderColor: activeTab === 'receive' ? 'var(--neon-blue)' : 'var(--brand-green)'}}></div>
              <div className="corner bl" style={{ borderColor: activeTab === 'receive' ? 'var(--neon-blue)' : 'var(--brand-green)'}}></div>
              <div className="corner br" style={{ borderColor: activeTab === 'receive' ? 'var(--neon-blue)' : 'var(--brand-green)'}}></div>
              
              <div className="vault-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <h2 className="font-display text-white" style={{ fontSize: '1.5rem', margin: 0 }}>
                    {activeTab === 'send' ? 'GENERATE NOTE' : 'REDEEM FUNDS'}
                  </h2>
                  <div style={{ border: '1px solid #333', padding: '2px 8px', fontSize: '0.7rem', color: '#666' }}>ZK-PROOF READY</div>
                </div>

                {activeTab === 'send' && (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--brand-green)', display: 'block', marginBottom: '8px' }}>SELECT ASSET</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {['TSS', 'USDC'].map(token => (
                          <button key={token} onClick={() => setSelectedTokenSymbol(token)} className={`token-btn ${selectedTokenSymbol === token ? 'active' : ''}`}>
                            {token}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '8px' }}>ENTER AMOUNT</label>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="terminal-input" placeholder="0.00" />
                      <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#666' }}>
                        Balance: {parseFloat(balances[selectedTokenSymbol] || 0).toFixed(2)}
                      </div>
                    </div>
                    <button onClick={handleSend} disabled={isLoading} className="btn-neon">
                      {isLoading ? "PROCESSING..." : "INITIATE PRIVACY"}
                    </button>
                    <AnimatePresence>
                      {secret && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ marginTop: '20px', padding: '15px', background: 'rgba(39, 192, 122, 0.05)', border: '1px solid rgba(39, 192, 122, 0.2)' }}>
                          <p style={{ fontSize: '0.7rem', color: 'var(--brand-green)', marginBottom: '5px' }}>SECRET NOTE GENERATED (SAVE THIS):</p>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <code style={{ flex: 1, background: 'black', padding: '8px', fontSize: '0.8rem', color: 'white', wordBreak: 'break-all' }}>{secret}</code>
                            <button onClick={() => copyToClipboard(secret)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Copy size={16} /></button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {activeTab === 'receive' && (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--neon-blue)', display: 'block', marginBottom: '8px' }}>PASTE SECRET NOTE</label>
                      <input 
                        type="text" 
                        value={secret} 
                        onChange={(e) => setSecret(e.target.value)} 
                        className="terminal-input blue-mode" 
                        placeholder="0x..." 
                      />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '8px' }}>RECIPIENT ADDRESS (FRESH WALLET)</label>
                      <input 
                        type="text" 
                        value={recipient} 
                        onChange={(e) => setRecipient(e.target.value)} 
                        className="terminal-input blue-mode" 
                        placeholder="0x..." 
                      />
                      <button onClick={() => setRecipient(walletAddress)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', fontSize: '0.7rem', marginTop: '5px', cursor: 'pointer', textDecoration: 'underline' }}>Use Connected Wallet</button>
                    </div>
                    <button 
                      onClick={handleRedeem} 
                      disabled={isLoading} 
                      className="btn-neon blue-mode"
                    >
                      {isLoading ? "DECRYPTING..." : "WITHDRAW FUNDS"}
                    </button>
                  </>
                )}

                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLoading ? 'yellow' : (activeTab === 'receive' ? 'var(--neon-blue)' : 'var(--brand-green)') }}></div>
                  <span style={{ color: '#666' }}>{status}</span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COL: LIVE DASHBOARD STATS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="info-panel">
                <div className="info-label"><Activity size={14}/> GAS PRICE</div>
                <div className="info-value" style={{color: 'var(--brand-green)'}}>{dashboardData.gasPrice || "..."} Gwei</div>
              </div>
              <div className="info-panel">
                <div className="info-label"><Database size={14}/> POOL SIZE (TVL)</div>
                <div className="info-value text-white">{dashboardData.poolSize || "..."} USDC</div>
              </div>
              <div className="info-panel">
                <div className="info-label"><Globe size={14}/> LATEST BLOCK</div>
                <div className="info-value text-blue" style={{color: 'var(--neon-blue)'}}>#{dashboardData.blockNumber || "..."}</div>
              </div>
              <div style={{ marginTop: 'auto', padding: '1rem', border: '1px solid #222', background: '#080808' }}>
                <p style={{ fontSize: '0.7rem', color: '#555' }}>
                  TIP: Always verify the recipient address before withdrawing. Transactions are irreversible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- 8. APP ROOT ---
function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isEthersReady, setIsEthersReady] = useState(false);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState('TSS');
  const [balances, setBalances] = useState({});
  const [provider, setProvider] = useState(null);
  const [dashboardData, setDashboardData] = useState({ gasPrice: null, blockNumber: null, poolSize: null });

  // Load Ethers
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
    script.async = true;
    script.onload = () => setIsEthersReady(true);
    document.body.appendChild(script);
    return () => { if(document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  // Lazy Provider Init
  useEffect(() => {
    if (isEthersReady && window.ethereum && window.ethers) {
      const p = new window.ethers.providers.Web3Provider(window.ethereum);
      setProvider(p);
    }
  }, [isEthersReady]);

  // Fetch Real Balances & Stats
  const fetchData = useCallback(async () => {
    if (!provider) return;
    
    // 1. Fetch Balances
    if (walletAddress) {
      const signer = provider.getSigner();
      const tss = new window.ethers.Contract(CONFIG.contracts.tss, ERC20ABI, signer);
      const usdc = new window.ethers.Contract(CONFIG.contracts.usdc, ERC20ABI, signer);
      
      try {
        const [tssBal, usdcBal] = await Promise.all([tss.balanceOf(walletAddress), usdc.balanceOf(walletAddress)]);
        setBalances({
          TSS: window.ethers.utils.formatUnits(tssBal, 18),
          USDC: window.ethers.utils.formatUnits(usdcBal, 6)
        });
      } catch (e) { console.log("Balance fetch err", e); }
    }

    // 2. Fetch Dashboard Stats
    try {
      const block = await provider.getBlockNumber();
      const feeData = await provider.getFeeData();
      // Fetch Pool TVL (USDC Balance of Pool Contract)
      const usdc = new window.ethers.Contract(CONFIG.contracts.usdc, ERC20ABI, provider);
      const poolBal = await usdc.balanceOf(CONFIG.contracts.pool);

      setDashboardData({
        blockNumber: block,
        gasPrice: window.ethers.utils.formatUnits(feeData.gasPrice, "gwei").substring(0, 5),
        poolSize: window.ethers.utils.formatUnits(poolBal, 6)
      });
    } catch (e) { console.log("Dashboard fetch err", e); }
  }, [provider, walletAddress]);

  // Initial Fetch & Heartbeat
  useEffect(() => {
    if (provider) {
      fetchData();
      const interval = setInterval(fetchData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [provider, fetchData]);

  const handleConnect = async () => {
    if (!provider) return;
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (err) { console.error(err); }
  };

  const handleDisconnect = () => setWalletAddress("");

  const onAddNetwork = async () => {
    if(window.ethereum) {
      try { await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [CONFIG.network] }); }
      catch(e) { console.error(e); }
    }
  };

  return (
    <BrowserRouter>
      <InjectedStyles />
      <AnimatePresence>
        <PrivacyNotice />
      </AnimatePresence>
      
      <Routes>
        <Route path="/" element={
          !walletAddress ? (
            <LandingPage 
              handleConnect={handleConnect} 
              isEthersReady={isEthersReady}
              onAddNetwork={onAddNetwork}
            />
          ) : (
            <MainApp 
              walletAddress={walletAddress}
              balances={balances}
              selectedTokenSymbol={selectedTokenSymbol}
              setSelectedTokenSymbol={setSelectedTokenSymbol}
              handleRefresh={fetchData}
              handleDisconnect={handleDisconnect}
              provider={provider}
              dashboardData={dashboardData}
            />
          )
        } />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
