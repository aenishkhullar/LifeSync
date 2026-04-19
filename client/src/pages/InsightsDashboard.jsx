import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSubscriptions } from '../api/subscriptions';
import {
  getRenewalReminders,
  getOverdueAlerts,
  getSpendingGrowth,
  getSmartAlerts,
} from '../utils/insightUtils';
import { useAuth } from '../context/AuthContext';
import { POPULAR_APPS } from '../constants/popularApps';
import '../styles/insights.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/* Small blue info badge SVG — matches the subscription card info icon */
const InfoBadge = () => (
  <span className="smartAlertBadge">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  </span>
);

export default function InsightsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const budget = user?.monthlyBudget || 0;
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchSubscriptions();
      if (response.success) {
        const mapped = response.data.map((sub) => ({
          id: sub._id,
          appId: sub.appId || 'other',
          name: sub.name,
          price: sub.price,
          cycle: sub.billingCycle,
          category: sub.category || 'Other',
          billingStartDate: sub.billingStartDate,
          color: sub.color || '#6b7280',
        }));
        setSubscriptions(mapped);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Compute all insights reactively
  const renewals = useMemo(() => getRenewalReminders(subscriptions), [subscriptions]);
  const overdue = useMemo(() => getOverdueAlerts(subscriptions), [subscriptions]);
  const growth = useMemo(() => getSpendingGrowth(subscriptions, budget), [subscriptions, budget]);
  const smartAlerts = useMemo(() => getSmartAlerts(subscriptions, budget), [subscriptions, budget]);

  if (isLoading) {
    return (
      <div className="insights">
        <div className="insightsLoading">
          <div className="loader"></div>
          <span>Crunching your insights…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="insights">
      {/* Navigation */}
      <div className="insightsNav">
        <button className="backBtn" onClick={() => navigate('/dashboard')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
      </div>

      {/* Header */}
      <header className="insightsHeader">
        <h1 className="insightsTitle">Insights</h1>
        <p className="insightsSubtitle">Smart analysis of your subscriptions</p>
      </header>

      {/* 2x2 Grid */}
      <div className="insightsGrid">
        {/* ── Card 1: Renewal Reminders ── */}
        <div className="insightCard" id="insight-renewal">
          <div className="insightCardHeader">
            <div className="insightIcon renewal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="insightCardTitle">Renewal Reminders</span>
          </div>
          <div className="insightBody">
            {renewals.length === 0 ? (
              <div className="insightEmpty">
                <svg className="insightEmptySvg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>No upcoming renewals</span>
              </div>
            ) : (
              renewals.map((r, i) => (
                <div className="insightRow" key={i}>
                  <span className="insightDot" style={{ backgroundColor: r.color }} />
                  <span className="insightRowText">
                    {r.name}
                  </span>
                  <span className="insightRowBadge soon">
                    Renews in {r.daysLeft} {r.daysLeft === 1 ? 'day' : 'days'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Card 2: Overdue Alerts ── */}
        <div className="insightCard" id="insight-overdue">
          <div className="insightCardHeader">
            <div className="insightIcon overdue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="insightCardTitle">Overdue Alerts</span>
          </div>
          <div className="insightBody">
            {overdue.length === 0 ? (
              <div className="insightEmpty">
                <svg className="insightEmptySvg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>All payments are on track</span>
              </div>
            ) : (
              overdue.map((o, i) => (
                <div className="insightRow" key={i}>
                  <span className="insightDot" style={{ backgroundColor: o.color }} />
                  <span className="insightRowText">
                    {o.name}
                  </span>
                  <span className="insightRowBadge overdue">
                    {o.daysPastDue} {o.daysPastDue === 1 ? 'day' : 'days'} late
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Card 3: Spending Growth ── */}
        <div className="insightCard" id="insight-growth">
          <div className="insightCardHeader">
            <div className="insightIcon growth">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <span className="insightCardTitle">Spending Growth</span>
          </div>
          <div className="insightBody">
            <div className="growthDisplay">
              <span className={`growthPercent ${growth.direction}`}>
                {growth.direction === 'up' ? '+' : growth.direction === 'down' ? '-' : ''}
                {growth.percentChange}%
              </span>
              <span className="growthLabel">
                {growth.direction === 'up'
                  ? 'increase from last month'
                  : growth.direction === 'down'
                    ? 'decrease from last month'
                    : 'vs last month'}
              </span>
            </div>
            <div className="growthGrid">
              <div className="growthStat">
                <span className="growthStatLabel">Last Month</span>
                <span className="growthStatValue">{formatCurrency(growth.previousMonth)}</span>
              </div>
              <div className="growthStat">
                <span className="growthStatLabel">This Month</span>
                <span className="growthStatValue">{formatCurrency(growth.currentMonth)}</span>
              </div>
              {growth.highDependency && (
                <div className="growthStat">
                  <span className="growthStatLabel">High Dependency</span>
                  <div className="highDepContent">
                    <div 
                      className="subIcon" 
                      style={{ 
                        backgroundColor: `${growth.highDependency.color}15`, 
                        color: growth.highDependency.color,
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px'
                      }}
                    >
                      {POPULAR_APPS.find(app => app.id === growth.highDependency.appId)?.logo || (
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {growth.budgetStatus && (
                <div className="growthStat">
                  <span className="growthStatLabel">Budget Status</span>
                  <span className={`budgetStatusValue ${growth.budgetStatus.type}`}>
                    {growth.budgetStatus.type === 'exceeded' 
                      ? `₹${new Intl.NumberFormat('en-IN').format(growth.budgetStatus.amount)} exceeded`
                      : `₹${new Intl.NumberFormat('en-IN').format(growth.budgetStatus.amount)} left`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Card 4: Smart Alerts ── */}
        <div className="insightCard" id="insight-smart">
          <div className="insightCardHeader">
            <div className="insightIcon smart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="insightCardTitle">Smart Alerts</span>
          </div>
          <div className="insightBody">
            {smartAlerts.length === 0 ? (
              <div className="insightEmpty">
                <svg className="insightEmptySvg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>No alerts right now</span>
              </div>
            ) : (
              smartAlerts.map((alert, i) => (
                <div className="smartAlertRow" key={i}>
                  <InfoBadge />
                  <div>
                    <span className="smartAlertMsg">{alert.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Credit footer */}
      <div className="credit">
        <span>
          <a href="https://altawebstudio.xyz" target="_blank" rel="noopener noreferrer">
            Coded by altawebstudio.xyz
          </a>
        </span>
      </div>
    </div>
  );
}
