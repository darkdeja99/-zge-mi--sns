export const formatTimeAgo = (
  timestamp: any,
  mode: "default" | "chat" = "default",
) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (mode === "chat") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    // Bugün ise sadece saat:dakika
    if (targetDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    // Dün ise
    else if (targetDate.getTime() === yesterday.getTime()) {
      return "Dün";
    }
    // Son 1 hafta içindeyse gün adı (Pazartesi vb.)
    else if (diffInSeconds < 7 * 86400) {
      return date.toLocaleDateString("tr-TR", { weekday: "long" });
    }
    // Daha eskiyse tam tarih (24.11.2023)
    else {
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  }

  if (diffInSeconds < 60) return "Az önce";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  return `${Math.floor(diffInSeconds / 86400)} gün önce`;
};
