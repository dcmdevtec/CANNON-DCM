import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string | number) => {
  // sonner toast.dismiss accepts the id returned by toast.loading which can be string or number
  // cast to any to satisfy types if needed
  toast.dismiss(toastId as any);
};
