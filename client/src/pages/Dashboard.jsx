import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from '../components/ui/LogoutButton';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker.css';
import {
  fetchSubscriptions,
  addSubscription,
  updateSubscription as updateSubscriptionAPI,
  deleteSubscription as deleteSubscriptionAPI,
} from '../api/subscriptions';

import { POPULAR_APPS } from '../constants/popularApps';

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', multiplier: 1 },
  { id: 'yearly', label: 'Yearly', multiplier: 1 / 12 },
  { id: 'weekly', label: 'Weekly', multiplier: 4.33 },
];

const SUBSCRIPTION_CATEGORIES = [
  'Entertainment',
  'Productivity',
  'Gaming',
  'Education',
  'Storage',
  'Development',
  'Music',
  'Streaming',
  'Utilities',
  'Design',
  'Cloud Services',
  'Finance',
  'Other'
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function Dashboard() {
  const { user, updateBudgetContext } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState('');
  
  const budget = user?.monthlyBudget || null;
  const [formData, setFormData] = useState({
    customName: '',
    price: '',
    cycle: 'monthly',
    category: 'Entertainment',
    billingStartDate: new Date().toISOString().split('T')[0],
  });

  // Load subscriptions from API on mount
  const loadSubscriptionsFromAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchSubscriptions();
      if (response.success) {
        // Map backend data shape to frontend shape
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
    loadSubscriptionsFromAPI();
  }, [loadSubscriptionsFromAPI]);

  const stats = useMemo(() => {
    let monthlyTotal = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    const activeSubs = subscriptions.filter(sub => {
      if (!sub.billingStartDate) return true;
      return sub.billingStartDate <= todayStr;
    });

    activeSubs.forEach((sub) => {
      const cycle = BILLING_CYCLES.find((c) => c.id === sub.cycle);
      const monthly = sub.price * (cycle?.multiplier || 1);
      monthlyTotal += monthly;
    });

    const yearlyTotal = monthlyTotal * 12;
    const dailyTotal = monthlyTotal / 30;

    return {
      monthlyTotal,
      yearlyTotal,
      dailyTotal,
      count: activeSubs.length,
    };
  }, [subscriptions]);

  const resetForm = () => {
    setFormData({ 
      customName: '', 
      price: '', 
      cycle: 'monthly', 
      category: 'Entertainment',
      billingStartDate: new Date().toISOString().split('T')[0] 
    });
    setSelectedApp(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSetBudgetClick = () => {
    setTempBudget(budget ? budget.toString() : '');
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = async () => {
    if (tempBudget.trim() === '') {
      await updateBudgetContext(0);
    } else {
      const num = parseFloat(tempBudget);
      if (!isNaN(num) && num >= 0) {
        await updateBudgetContext(num);
      }
    }
    setIsBudgetModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = selectedApp === 'other' ? formData.customName.trim() : selectedApp?.name;
    if (!name || !formData.price) return;

    const subData = {
      appId: selectedApp === 'other' ? 'other' : selectedApp?.id,
      name,
      price: parseFloat(formData.price),
      billingCycle: formData.cycle,
      category: formData.category,
      billingStartDate: formData.billingStartDate,
      color: selectedApp === 'other' ? '#6b7280' : selectedApp?.color,
    };

    try {
      setIsSaving(true);
      if (editingId) {
        await updateSubscriptionAPI(editingId, subData);
      } else {
        await addSubscription(subData);
      }
      await loadSubscriptionsFromAPI();
      resetForm();
    } catch (error) {
      console.error('Failed to save subscription:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (sub) => {
    const app = POPULAR_APPS.find((a) => a.id === sub.appId);
    setSelectedApp(app || 'other');
    setFormData({
      customName: sub.appId === 'other' ? sub.name : '',
      price: sub.price.toString(),
      cycle: sub.cycle,
      category: sub.category || 'Other',
      billingStartDate: sub.billingStartDate || new Date().toISOString().split('T')[0],
    });
    setEditingId(sub.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    try {
      setIsSaving(true);
      await deleteSubscriptionAPI(id);
      await loadSubscriptionsFromAPI();
      if (editingId === id) resetForm();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getMonthlyAmount = (sub) => {
    const cycle = BILLING_CYCLES.find((c) => c.id === sub.cycle);
    return sub.price * (cycle?.multiplier || 1);
  };

  const getAppInfo = (appId) => POPULAR_APPS.find((a) => a.id === appId);

  return (
    <div className="app">
      <header className="header">
        <div className="flex items-center justify-center gap-2 mb-4 w-full">
            <div className="userProfile">
                <button className="iconBtn profile" aria-label="Profile" title="View Insights" onClick={() => navigate('/insights')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
                <LogoutButton />
            </div>
        </div>
        <h1 className="title">Subscriptions</h1>
        <p className="subtitle">Track where your money goes</p>
      </header>

      <main className="main">
        <div className="card statsCard">
          <div className="statGrid">
            <div className="stat primary">
              <span className="statLabel">Monthly</span>
              <span className="statValue">{formatCurrency(stats.monthlyTotal)}</span>
            </div>
            <div className="stat">
              <span className="statLabel">Yearly</span>
              <span className="statValue">{formatCurrency(stats.yearlyTotal)}</span>
            </div>
            <div className="stat">
              <span className="statLabel">Daily</span>
              <span className="statValue">{formatCurrency(stats.dailyTotal)}</span>
            </div>
            <div className="stat">
              <span className="statLabel">Active</span>
              <span className="statValue">{stats.count}</span>
            </div>
            <div className="stat">
              <span className="statLabel">Monthly Budget</span>
              <span className="statValue">{budget !== null && budget > 0 ? formatCurrency(parseFloat(budget)) : 'Not set'}</span>
            </div>
          </div>
        </div>

        <div className="card listCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Your Subscriptions</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="iconBtn success" onClick={handleSetBudgetClick} title="Set Budget">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
                  <path d="M16 12H21" />
                </svg>
              </button>
              {!isAdding && (
                <button className="iconBtn" onClick={() => setIsAdding(true)} title="Add Subscription">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {isAdding && (
            <form className="form" onSubmit={handleSubmit}>
              <div className="formSection">
                <label className="label">Select Service</label>
                <div className="appGrid">
                  {POPULAR_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className={`appChip ${selectedApp?.id === app.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedApp(app);
                        if (app.category) {
                          setFormData(prev => ({ ...prev, category: app.category }));
                        }
                      }}
                      style={{
                        '--app-color': app.color,
                      }}
                    >
                      <span className="appLogo" style={{ color: app.color }}>
                        {app.logo}
                      </span>
                      <span className="appName">{app.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`appChip other ${selectedApp === 'other' ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedApp('other');
                      setFormData(prev => ({ ...prev, category: 'Other' }));
                    }}
                  >
                    <span className="appLogo other">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    </span>
                    <span className="appName">Other</span>
                  </button>
                </div>
              </div>

              {selectedApp === 'other' && (
                <div className="formGroup">
                  <label className="label">Service Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter service name..."
                    value={formData.customName}
                    onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                    autoFocus
                  />
                </div>
              )}

              {selectedApp && (
                <div className="formGrid">
                  <div className="formGroup">
                    <label className="label">Price</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      autoFocus={selectedApp !== 'other'}
                    />
                  </div>
                  <div className="formGroup">
                    <label className="label">Billing Cycle</label>
                    <select
                      className="select"
                      value={formData.cycle}
                      onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                    >
                      {BILLING_CYCLES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {selectedApp !== 'other' && (
                    <div className="formGroup">
                      <label className="label">Category</label>
                      <select
                        className="select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {SUBSCRIPTION_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="formGroup" style={{ gridColumn: selectedApp === 'other' ? 'span 1' : '1 / -1' }}>
                    <label className="label">Billing Start Date</label>
                    <DatePicker
                      className="input"
                      selected={formData.billingStartDate ? (function(){
                        const [y, m, d] = formData.billingStartDate.split('-');
                        return new Date(y, m - 1, d);
                      })() : null}
                      onChange={(date) => {
                        if (date) {
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          setFormData({ ...formData, billingStartDate: `${yyyy}-${mm}-${dd}` });
                        } else {
                          setFormData({ ...formData, billingStartDate: '' });
                        }
                      }}
                      dateFormat="dd MMM yyyy"
                      placeholderText="Select start date"
                      showPopperArrow={false}
                    />
                  </div>
                  {selectedApp === 'other' && (
                    <div className="formGroup">
                      <label className="label">Category</label>
                      <select
                        className="select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {SUBSCRIPTION_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="formActions">
                <button type="button" className="btn ghost" onClick={resetForm}>Cancel</button>
                <button
                  type="submit"
                  className="btn primaryLight"
                  disabled={!selectedApp || !formData.price || (selectedApp === 'other' && !formData.customName.trim()) || isSaving}
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update' : 'Add Subscription'}
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="empty">
              <p>Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 && !isAdding ? (
            <div className="empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <p>No subscriptions yet</p>
              <span>Add your first subscription to start tracking</span>
            </div>
          ) : (
            <ul className="subList">
              {subscriptions.map((sub) => {
                const app = getAppInfo(sub.appId);
                const monthly = getMonthlyAmount(sub);
                return (
                  <li key={sub.id} className="subItem">
                    <div
                      className="subIcon"
                      style={{
                        backgroundColor: sub.appId === 'other' ? '#374151' : `${sub.color}20`,
                        color: sub.color
                      }}
                    >
                      {app ? app.logo : sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="subInfo">
                      <span className="subName">{sub.name}</span>
                      <span className="subMeta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {BILLING_CYCLES.find((c) => c.id === sub.cycle)?.label}
                        {sub.billingStartDate && (
                          <div className="tooltip-container">
                            <button type="button" className="info-icon" aria-label="Info">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                              </svg>
                            </button>
                            <div className="tooltip-content">
                              Start Date: {(function(){
                                const [y, m, d] = sub.billingStartDate.split('-');
                                const dateObj = new Date(y, m - 1, d);
                                return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                              })()}
                            </div>
                          </div>
                        )}
                      </span>
                    </div>
                    <div className="subPricing">
                      <span className="subPrice">{formatCurrency(sub.price)}</span>
                      {sub.cycle !== 'monthly' && (
                        <span className="subMonthly">{formatCurrency(monthly)}/mo</span>
                      )}
                    </div>
                    <div className="subActions">
                      <button
                        className="iconBtn"
                        onClick={() => handleEdit(sub)}
                        aria-label="Edit subscription"
                        disabled={isSaving}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="iconBtn danger"
                        onClick={() => handleDelete(sub.id)}
                        aria-label="Delete subscription"
                        disabled={isSaving}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <div className="credit">
        <span>
          <a href="https://altawebstudio.xyz" target="_blank" rel="noopener noreferrer">
            Coded by altawebstudio.xyz
          </a>
        </span>
      </div>

      {isBudgetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBudgetModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Set Monthly Budget</h3>
            <div className="formGroup">
              <input
                type="number"
                className="input"
                placeholder="Enter amount"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveBudget();
                  }
                }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setIsBudgetModalOpen(false)}>
                Cancel
              </button>
              <button className="btn primaryLight" onClick={handleSaveBudget}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
