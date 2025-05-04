export const getRecentTransactions = (data: any[]) => {
    if (!data || data.length === 0) return [];
  
    // Sort the data by month descending (latest first)
    const sorted = [...data].sort((a, b) => {
      return new Date(b.month).getTime() - new Date(a.month).getTime();
    });
  
    const mostRecent = sorted[0];
    if (!mostRecent || !mostRecent.transactions) return [];
  
    return mostRecent.transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };
  