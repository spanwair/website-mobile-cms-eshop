import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { setItem, getItem } from "../../lib/storage";

const ONBOARDING_KEY = "onboarding_done";

export const markOnboardingDone = () => setItem(ONBOARDING_KEY, true);
export const hasSeenOnboarding = () => getItem<boolean>(ONBOARDING_KEY) === true;

const SLIDES = [
  {
    emoji: "🚀",
    title: "Welcome",
    body: "Your new app is ready. This is where your onboarding story begins.",
  },
  {
    emoji: "⚡",
    title: "Fast & Powerful",
    body: "Built with Expo, Supabase, and React Query for a blazing-fast experience.",
  },
  {
    emoji: "🔒",
    title: "Secure by Default",
    body: "Email/password + Google OAuth via Supabase. Your data stays safe.",
  },
];

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const [index, setIndex] = React.useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      markOnboardingDone();
      onDone();
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleSkip() {
    markOnboardingDone();
    onDone();
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F1A]">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-8xl mb-8">{slide.emoji}</Text>
        <Text className="text-[32px] font-extrabold text-white text-center mb-4 -tracking-[0.8px]">
          {slide.title}
        </Text>
        <Text className="text-base text-[#B3B3CC] text-center leading-6">
          {slide.body}
        </Text>
      </View>

      <View className="px-8 pb-8">
        <View className="flex-row justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${
                i === index ? "w-8 bg-[#FF5E1A]" : "w-2 bg-[#252538]"
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          className="h-14 rounded-full bg-[#FF5E1A] items-center justify-center"
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-bold">
            {isLast ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>

        {!isLast ? (
          <TouchableOpacity
            className="mt-4 items-center"
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text className="text-[#808099] text-sm">Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
