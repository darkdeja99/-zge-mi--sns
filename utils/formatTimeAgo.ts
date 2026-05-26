export const formatTimeAgo = (timestamp: any) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Az önce";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  return `${Math.floor(diffInSeconds / 86400)} gün önce`;
};
