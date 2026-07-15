import React from "react";
import { Text as RNText, type TextProps } from "react-native";

interface Props extends TextProps {
  variant?: "display" | "heading" | "title" | "body" | "caption" | "micro";
  className?: string;
}

const VARIANTS = {
  display: "text-[32px] font-extrabold -tracking-[0.8px] text-white dark:text-white",
  heading: "text-2xl font-bold -tracking-[0.4px] text-white dark:text-white",
  title: "text-xl font-bold -tracking-[0.2px] text-white dark:text-white",
  body: "text-[15px] font-normal leading-[22px] text-[#B3B3CC] dark:text-[#B3B3CC]",
  caption: "text-[13px] font-medium text-[#808099] dark:text-[#808099]",
  micro: "text-[11px] font-bold tracking-[0.8px] uppercase text-[#808099] dark:text-[#808099]",
};

export function Text({ variant = "body", className = "", children, ...props }: Props) {
  return (
    <RNText className={`${VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </RNText>
  );
}
