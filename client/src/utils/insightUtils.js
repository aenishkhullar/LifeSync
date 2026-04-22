/**
 * Insight calculation utilities for LifeSync subscriptions.
 * All functions accept the raw subscription array (frontend shape)
 * and return structured insight data.
 *
 * Renewal logic uses proper calendar math:
 *   monthly  → add 1 month
 *   yearly   → add 1 year
 *   weekly   → add 7 days
 */

const CYCLE_MULTIPLIER_TO_MONTHLY = {
  weekly: 4.33,
  monthly: 1,
  yearly: 1 / 12,
};

/**
 * Parse a "YYYY-MM-DD" date string into a local Date at midnight.
 */
function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/**
 * Calculates the next renewal date and the difference in days from today.
 * Next renewal is defined strictly as billingStartDate + 1 cycle.
 */
function getSubscriptionStatus(sub) {
  const start = parseDate(sub.billingStartDate);
  if (!start) return null;

  const next = new Date(start);
  if (sub.cycle === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (sub.cycle === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    // weekly
    next.setDate(next.getDate() + 7);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = next - today;
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return { nextDate: next, daysDiff };
}

/**
 * Renewal Reminders — subscriptions whose next renewal is today or in the future.
 * Returns an array of { name, color, daysLeft }.
 */
export function getRenewalReminders(subscriptions) {
  const reminders = [];

  subscriptions.forEach((sub) => {
    const status = getSubscriptionStatus(sub);
    if (!status) return;

    // Only show future or today's renewals (daysDiff >= 0)
    if (status.daysDiff >= 0) {
      reminders.push({
        name: sub.name,
        color: sub.color,
        daysLeft: status.daysDiff,
      });
    }
  });

  // Sort soonest first
  reminders.sort((a, b) => a.daysLeft - b.daysLeft);
  return reminders;
}

/**
 * Overdue / Missed Payment alerts — subscriptions whose next renewal date is in the past.
 * Returns an array of { name, color, daysPastDue }.
 */
export function getOverdueAlerts(subscriptions) {
  const alerts = [];

  subscriptions.forEach((sub) => {
    const status = getSubscriptionStatus(sub);
    if (!status) return;

    // Flag as overdue if daysDiff < 0
    if (status.daysDiff < 0) {
      alerts.push({
        name: sub.name,
        color: sub.color,
        daysPastDue: Math.abs(status.daysDiff),
      });
    }
  });

  alerts.sort((a, b) => b.daysPastDue - a.daysPastDue);
  return alerts;
}

/**
 * Budget Status — calculates if the user is over or under budget.
 */
export function getBudgetStatus(total, budget) {
  if (!budget || budget === 0) return null;

  if (total > budget) {
    return {
      type: 'exceeded',
      amount: total - budget,
    };
  }

  return {
    type: 'left',
    amount: budget - total,
  };
}

/**
 * Category Contribution — identifies top spending category for the current month.
 */
export function getCategoryInsight(subscriptions) {
  if (!subscriptions || subscriptions.length === 0) return null;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const categoryTotals = {};

  subscriptions.forEach((sub) => {
    const billedThisMonth = calculateActualMonthlySpend([sub], currentYear, currentMonth);
    if (billedThisMonth > 0) {
      const category = sub.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + billedThisMonth;
    }
  });

  let topCategory = null;
  let max = 0;

  for (let category in categoryTotals) {
    if (categoryTotals[category] > max) {
      max = categoryTotals[category];
      topCategory = category;
    }
  }

  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const percent = ((max / total) * 100).toFixed(1);

  return {
    category: topCategory,
    percent,
  };
}

/**
 * Calculates the actual spend for a specific month/year based on billing cycles.
 * Respects billingStartDate and billingCycle.
 * Monthly: Billed every month after start.
 * Yearly: Billed only in the anniversary month.
 * Weekly: Billed every week (roughly 4-5 times a month).
 */
export function calculateActualMonthlySpend(subscriptions, year, month) {
  const targetStart = new Date(year, month, 1);
  const targetEnd = new Date(year, month + 1, 0);
  let total = 0;

  subscriptions.forEach((sub) => {
    const start = parseDate(sub.billingStartDate);
    if (!start || start > targetEnd) return;

    const price = Number(sub.price) || 0;

    if (sub.cycle === 'monthly') {
      // Billed every month after start
      total += price;
    } else if (sub.cycle === 'yearly') {
      // Billed only in the month of anniversary
      if (start.getMonth() === month) {
        total += price;
      }
    } else if (sub.cycle === 'weekly') {
      // Count how many times the day of week falls in this month
      let count = 0;
      let curr = new Date(start);
      // Advance to the first occurrence in or after targetStart
      while (curr < targetStart) {
        curr.setDate(curr.getDate() + 7);
      }
      // Count occurrences within the target month
      while (curr <= targetEnd) {
        count++;
        curr.setDate(curr.getDate() + 7);
      }
      total += price * count;
    }
  });

  return total;
}

/**
 * Spending Growth — compare current month actual total vs previous month.
 * Returns { currentMonth, previousMonth, percentChange, direction, highDependency, lowUsage, budgetStatus }.
 */
export function getSpendingGrowth(subscriptions, userBudget = 0) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }

  const current = calculateActualMonthlySpend(subscriptions, currentYear, currentMonth);
  const previous = calculateActualMonthlySpend(subscriptions, prevYear, prevMonth);

  let percentChange = 0;
  let direction = 'unchanged';

  if (previous > 0) {
    percentChange = ((current - previous) / previous) * 100;
    direction = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'unchanged';
  } else if (current > 0) {
    percentChange = 100;
    direction = 'up';
  }

  // Enhancements
  let highDependency = null;
  if (current > 0) {
    // For "High Dependency", we might still want to look at "monthly equivalent" 
    // to see which sub is most expensive overall, OR just what's most expensive THIS month.
    // Let's stick to what's billed THIS month for consistency with the "current" total.
    const sorted = [...subscriptions]
      .map(sub => ({ ...sub, billedThisMonth: calculateActualMonthlySpend([sub], currentYear, currentMonth) }))
      .sort((a, b) => b.billedThisMonth - a.billedThisMonth);
    
    const top = sorted[0];
    if (top && top.billedThisMonth > 0) {
      const pct = (top.billedThisMonth / current) * 100;
      highDependency = {
        name: top.name,
        appId: top.appId,
        color: top.color,
        percentage: pct.toFixed(0),
        message: `${top.name} makes up ${pct.toFixed(0)}% of your spend this month`
      };
    }
  }

  let lowUsage = null;
  if (subscriptions.length >= 4 && current < 300) {
    lowUsage = {
      message: "You have multiple subscriptions but low total usage"
    };
  }

  return {
    currentMonth: current,
    previousMonth: previous,
    percentChange: Math.abs(percentChange).toFixed(1),
    direction,
    highDependency,
    lowUsage,
    budgetStatus: getBudgetStatus(current, userBudget),
  };
}

/**
 * Smart Alerts — 4 data-driven insights.
 * Returns an array of { message } objects.
 */
export function getSmartAlerts(subscriptions, userBudget = 0) {
  const alerts = [];

  if (subscriptions.length === 0) {
    alerts.push({ message: 'Add your first subscription to unlock insights.' });
    return alerts;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // 1. Renewal Insight (< 5 days)
  let renewingSoonCount = 0;
  subscriptions.forEach(sub => {
    const status = getSubscriptionStatus(sub);
    // Only count if it's an active sub (started already) and renewing in < 5 days
    if (status && sub.billingStartDate <= todayStr && status.daysDiff >= 0 && status.daysDiff < 5) {
      renewingSoonCount++;
    }
  });
  if (renewingSoonCount > 0) {
    alerts.push({ message: `${renewingSoonCount} ${renewingSoonCount === 1 ? 'subscription is' : 'subscriptions are'} gonna renew in coming few days` });
  }

  // 2. Category Spending Insight
  const categoryTotals = {};
  subscriptions.forEach((sub) => {
    if (sub.billingStartDate > todayStr) return; // Only count active ones
    const category = sub.category || 'Other';
    const mult = CYCLE_MULTIPLIER_TO_MONTHLY[sub.cycle] || 1;
    const monthlyAmount = Number(sub.price) * mult;
    categoryTotals[category] = (categoryTotals[category] || 0) + monthlyAmount;
  });

  let topCategory = null;
  let maxSpend = 0;
  for (const cat in categoryTotals) {
    if (categoryTotals[cat] > maxSpend) {
      maxSpend = categoryTotals[cat];
      topCategory = cat;
    }
  }
  if (topCategory) {
    alerts.push({ message: `${topCategory} category consumes most of your money this month` });
  }

  // 3. Upcoming Activations (Not yet active, but will be this month)
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  let upcomingActivations = 0;
  subscriptions.forEach(sub => {
    const start = parseDate(sub.billingStartDate);
    if (start && start > today && start <= lastDayOfMonth) {
      upcomingActivations++;
    }
  });
  if (upcomingActivations > 0) {
    alerts.push({ message: `You have ${upcomingActivations} ${upcomingActivations === 1 ? 'subscription' : 'subscriptions'} that will active this month` });
  }

  // 4. Budget Proximity
  const totalMonthly = subscriptions.reduce((sum, sub) => {
    if (sub.billingStartDate > todayStr) return sum;
    const mult = CYCLE_MULTIPLIER_TO_MONTHLY[sub.cycle] || 1;
    return sum + sub.price * mult;
  }, 0);

  if (userBudget > 0) {
    if (totalMonthly > userBudget) {
      const excess = totalMonthly - userBudget;
      alerts.push({ message: `You have exceeded your monthly budget by ₹${new Intl.NumberFormat('en-IN').format(excess)}` });
    } else if (totalMonthly >= userBudget * 0.8) {
      alerts.push({ message: 'You are close to your monthly budget' });
    }
  }

  return alerts.slice(0, 4);
}
