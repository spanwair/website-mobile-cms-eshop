import React from "react";
import { View, type ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export function Card({ children, style, className = "" }: Props) {
  return (
    <View
      className={`bg-[#1A1A2E] dark:bg-[#1A1A2E] rounded-2xl p-4 border border-[#252538] ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
