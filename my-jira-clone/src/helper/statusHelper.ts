
export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    todo: "Cần làm",
    in_progress: "Đang làm",
    fix: "Sửa lỗi",
    review: "Đang kiểm tra",
    done: "Đã hoàn thành",
    blocked: "Cần làm",
  };
  return statusMap[status] || status;
};
export const getStatusValue = (label: string): string => {
  const labelMap: Record<string, string> = {
    "Cần làm": "todo",
    "Đang làm": "in_progress",
    "Đang kiểm tra": "review",
    "Đã hoàn thành": "done",
  };
  return labelMap[label] || label.toLowerCase().replace(/\s+/g, "_");
};