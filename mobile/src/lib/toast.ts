import { showMessage } from "react-native-flash-message";

export const toast = {
  success: (message: string, description?: string) =>
    showMessage({
      message,
      description,
      type: "success",
      duration: 3000,
      icon: "success",
    }),
  error: (message: string, description?: string) =>
    showMessage({
      message,
      description,
      type: "danger",
      duration: 4000,
      icon: "danger",
    }),
  info: (message: string, description?: string) =>
    showMessage({
      message,
      description,
      type: "info",
      duration: 3000,
      icon: "info",
    }),
};
