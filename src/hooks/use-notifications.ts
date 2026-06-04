"use client";

import { useEffect, useState } from "react";

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true");
      if (!response.ok) return;
      const data = await response.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { unreadCount, refetch: fetchUnreadCount };
}