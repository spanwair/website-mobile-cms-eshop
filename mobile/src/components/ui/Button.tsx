import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const VARIANT = {
  primary: { btn: "bg-primary", text: "text-white" },
  secondary: { btn: "border border-primary bg-transparent", text: "text-primary" },
  ghost: { btn: "bg-transparent", text: "text-gray-500 dark:text-gray-400" },
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  className = "",
}: Props) {
  const v = VARIANT[variant];
  return (
    <TouchableOpacity
      className={`h-14 rounded-full items-center justify-center px-8 ${v.btn} ${disabled || loading ? "opacity-50" : ""} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#fff" : "#FF5E1A"}
          size="small"
        />
      ) : (
        <Text className={`text-base font-bold ${v.text}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
