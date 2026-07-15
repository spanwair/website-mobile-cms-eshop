import React from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  className?: string;
}

export function Input({ label, error, className = "", ...props }: Props) {
  return (
    <View className="mb-3">
      {label ? (
        <Text className="text-xs font-bold text-[#808099] uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      ) : null}
      <TextInput
        className={`bg-[#1E1E35] dark:bg-[#1E1E35] border-[1.5px] ${
          error ? "border-[#FF3B55]" : "border-[#252538]"
        } rounded-2xl p-3.5 text-base text-white ${className}`}
        placeholderTextColor="#808099"
        {...props}
      />
      {error ? (
        <Text className="text-xs text-[#FF3B55] mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
