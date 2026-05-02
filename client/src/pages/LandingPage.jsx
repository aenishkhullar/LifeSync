import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/landing.css';

import claudeIcon from '../assets/claude.png';
import netflixIcon from '../assets/netflix.png';
import figmaIcon from '../assets/figma.png';
import primeIcon from '../assets/prime.png';
import xboxIcon from '../assets/xbox.png';
import spotifyIcon from '../assets/spotify.png';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  
  // Stat Counters State
  const [savedAmount, setSavedAmount] = useState(0);
  const [subsCount, setSubsCount] = useState(0);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  const navigate = useNavigate();

  // Scroll Observer Refs
  const revealRefs = useRef([]);

  useEffect(() => {
    // Check JWT
    const token = localStorage.getItem('token');
    if (token) setHasToken(true);

    // Navbar Scroll
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for Elements
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ls-visible');
          if (entry.target.id === 'stats-container' && !statsVisible) {
            setStatsVisible(true);
            animateCounters();
          }
        }
      });
    };
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    revealRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    if (statsRef.current) observer.observe(statsRef.current);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [statsVisible]);

  const animateCounters = () => {
    const targetSaved = 12400;
    const targetSubs = 6;
    const duration = 2000;
    const interval = 20;
    const steps = duration / interval;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Easing function outQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      setSavedAmount(Math.floor(easeProgress * targetSaved));
      setSubsCount(Math.floor(easeProgress * targetSubs));

      if (currentStep >= steps) {
        clearInterval(timer);
        setSavedAmount(targetSaved);
        setSubsCount(targetSubs);
      }
    }, interval);
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="ls-landing-wrapper">
      {/* NAVBAR */}
      <nav className={`ls-navbar ${isScrolled ? 'ls-scrolled' : ''} ${isMobileMenuOpen ? 'ls-nav-mobile-active' : ''}`}>
        <Link to="/" className="ls-logo">
          <span>∞</span> LifeSync
        </Link>
        
        <button className="ls-mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className="ls-nav-links">
          <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')}>Home</a>
          <Link to="/dashboard">Dashboard</Link>
          <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a>
        </div>
        
        <div className="ls-nav-actions">
          <Link to="/login" className="ls-btn-glass">Login</Link>
          <Link to="/register" className="ls-btn-primary">Register</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="ls-hero">
        <div className="ls-orb-background"></div>
        
        {/* Hero Icons */}
        <div className="ls-floating-icon ls-glow-claude ls-pos-claude">
          <img src={claudeIcon} alt="Claude" />
          <div className="ls-tooltip">Claude • ₹1,650/mo</div>
        </div>
        <div className="ls-floating-icon ls-glow-netflix ls-pos-netflix">
          <img src={netflixIcon} alt="Netflix" />
          <div className="ls-tooltip">Netflix • ₹199/mo</div>
        </div>
        <div className="ls-floating-icon ls-glow-figma ls-pos-figma">
          <img src={figmaIcon} alt="Figma" />
          <div className="ls-tooltip">Figma • ₹4,100/mo</div>
        </div>
        <div className="ls-floating-icon ls-glow-prime ls-pos-prime">
          <img src={primeIcon} alt="Prime" />
          <div className="ls-tooltip">Prime • ₹299/mo</div>
        </div>
        <div className="ls-floating-icon ls-glow-spotify ls-pos-spotify">
          <img src={spotifyIcon} alt="Spotify" />
          <div className="ls-tooltip">Spotify • ₹119/mo</div>
        </div>
        <div className="ls-floating-icon ls-glow-xbox ls-pos-xbox">
          <img src={xboxIcon} alt="Xbox" />
          <div className="ls-tooltip">Xbox • ₹699/mo</div>
        </div>

        <div className="ls-hero-content">
          <div className="ls-hero-badge">✦ Smart Subscription Intelligence</div>
          <h1>Take Control of Every Subscription You Pay For</h1>
          <p>
            LifeSync tracks all your recurring payments, alerts you before renewals, 
            and gives you real financial clarity — all in one beautiful dashboard.
          </p>
          <div className="ls-hero-actions">
            <Link to="/register" className="ls-btn-primary">Start Tracking Free →</Link>
            <Link to="/dashboard" className="ls-btn-glass">View Dashboard</Link>
          </div>
          <div className="ls-hero-trust">
            No credit card required • 5-minute setup • Cancel anytime
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="ls-stats-bar">
        <div className="ls-stats-container ls-reveal" id="stats-container" ref={statsRef}>
          <div>
            <div className="ls-stat-value">₹{savedAmount.toLocaleString()}</div>
            <div className="ls-stat-label">avg. saved yearly</div>
          </div>
          <div>
            <div className="ls-stat-value">36+</div>
            <div className="ls-stat-label">subscriptions per user</div>
          </div>
          <div>
            <div className="ls-stat-value">Real-time</div>
            <div className="ls-stat-label">renewal alerts</div>
          </div>
          <div>
            <div className="ls-stat-value">Bank-level</div>
            <div className="ls-stat-label">JWT security</div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="ls-section">


        <h2 className="ls-section-title ls-reveal" ref={el => revealRefs.current.push(el)}>
          Everything You Need to Stay in Control
        </h2>
        
        <div className="ls-features-grid">
          {[
            { title: "Spending Dashboard", desc: "Visual charts for monthly trends and total spend." },
            { title: "Renewal Alerts", desc: "Never get surprise-charged again with smart reminders." },
            { title: "Budget Control", desc: "Set limits per category and track against them." },
            { title: "Category Insights", desc: "See exactly where your money goes every month." },
            { title: "PDF Export", desc: "Download beautifully branded reports anytime." },
            { title: "Secure Auth", desc: "JWT-powered, enterprise-grade data protection." }
          ].map((feature, i) => (
            <div key={i} className={`ls-glass-card ls-feature-card ls-reveal ls-delay-${(i+1)*100}`} ref={el => revealRefs.current.push(el)}>
              <h3 className="ls-feature-title">{feature.title}</h3>
              <p className="ls-feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* HOW IT WORKS SECTION */}
      <section className="ls-section">
        <h2 className="ls-section-title ls-reveal" ref={el => revealRefs.current.push(el)}>
          How It Works
        </h2>
        <div className="ls-steps-container ls-reveal" ref={el => revealRefs.current.push(el)}>
          <div className="ls-steps-line"></div>
          {[
            { num: 1, title: "Add your subscriptions", desc: "Quickly input your active apps, prices, and renewal cycles." },
            { num: 2, title: "Set your monthly budget", desc: "Define limits to ensure you never overspend on software." },
            { num: 3, title: "Get insights & smart alerts", desc: "Sit back while we track your data and remind you." }
          ].map((step, i) => (
            <div key={i} className="ls-step">
              <div className="ls-step-num">{step.num}</div>
              <div className="ls-step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBSCRIPTION SHOWCASE */}
      <section className="ls-section">
        <h2 className="ls-section-title ls-reveal" ref={el => revealRefs.current.push(el)}>
          Track Every App That Charges You
        </h2>
        <div className="ls-showcase-row ls-reveal" ref={el => revealRefs.current.push(el)}>
          {[
            { img: claudeIcon, name: "Claude", price: "₹1,650" },
            { img: netflixIcon, name: "Netflix", price: "₹199" },
            { img: figmaIcon, name: "Figma", price: "₹4,100" },
            { img: primeIcon, name: "Prime", price: "₹299" },
            { img: xboxIcon, name: "Xbox", price: "₹699" },
            { img: spotifyIcon, name: "Spotify", price: "₹119" }
          ].map((app, i) => (
            <div key={i} className="ls-showcase-item">
              <img src={app.img} alt={app.name} />
              <span>{app.name}</span>
              <small>{app.price}/mo</small>
            </div>
          ))}
          <div className="ls-showcase-item ls-showcase-more">
            <span>+ many more</span>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="ls-section">
        <h2 className="ls-section-title ls-reveal" ref={el => revealRefs.current.push(el)}>
          Simple, Transparent Pricing
        </h2>
        <div className="ls-pricing-grid">
          {/* Free Tier */}
          <div className="ls-glass-card ls-pricing-card ls-reveal" ref={el => revealRefs.current.push(el)}>
            <h3 className="ls-pricing-title">Free</h3>
            <div className="ls-pricing-price">₹0<span>/mo</span></div>
            <ul className="ls-pricing-features">
              <li>Up to 5 subscriptions</li>
              <li>Basic renewal alerts</li>
              <li>Dashboard access</li>
              <li>Standard community support</li>
            </ul>
            <Link to="/register" className="ls-btn-glass ls-pricing-btn">Get Started Free</Link>
          </div>

          {/* Pro Tier */}
          <div className="ls-glass-card ls-pricing-card ls-pricing-pro ls-reveal ls-delay-200" ref={el => revealRefs.current.push(el)}>
            <div className="ls-pricing-badge">Most Popular</div>
            <h3 className="ls-pricing-title">Pro</h3>
            <div className="ls-pricing-price">₹199<span>/mo</span></div>
            <ul className="ls-pricing-features">
              <li>Unlimited subscriptions</li>
              <li>Smart insights & analytics</li>
              <li>PDF report exports</li>
              <li>Priority email support</li>
              <li>Custom categories</li>
            </ul>
            <Link to="/register" className="ls-btn-primary ls-pricing-btn">Upgrade to Pro</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ls-footer">
        <div className="ls-footer-content">
          <div className="ls-logo">
            <span>∞</span> LifeSync
          </div>
          <p>Your subscriptions, finally under control.</p>
          <div className="ls-footer-links">
            <Link to="#">Privacy</Link>
            <Link to="#">Terms</Link>
            <Link to="#">GitHub</Link>
            <Link to="#">Contact</Link>
          </div>
          <div className="ls-credit">
            <span>
              <a href="https://altawebstudio.xyz" target="_blank" rel="noopener noreferrer">
                Coded by altawebstudio.xyz
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
