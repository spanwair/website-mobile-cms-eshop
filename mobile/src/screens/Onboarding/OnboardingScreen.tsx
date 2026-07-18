import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { setItem, getItem } from "../../lib/storage";

const ONBOARDING_KEY = "onboarding_done";

export const markOnboardingDone = () => setItem(ONBOARDING_KEY, true);
export const hasSeenOnboarding = () => getItem<boolean>(ONBOARDING_KEY) === true;

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = React.useState(0);

  const slides = [
    { emoji: "🚀", title: t("onboarding.slide1Title"), body: t("onboarding.slide1Body") },
    { emoji: "⚡", title: t("onboarding.slide2Title"), body: t("onboarding.slide2Body") },
    { emoji: "🔒", title: t("onboarding.slide3Title"), body: t("onboarding.slide3Body") },
  ];

  const slide = slides[index];
  const isLast = index === slides.length - 1;

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
          {slides.map((_, i) => (
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
            {isLast ? t("onboarding.getStarted") : t("onboarding.next")}
          </Text>
        </TouchableOpacity>

        {!isLast ? (
          <TouchableOpacity
            className="mt-4 items-center"
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text className="text-[#808099] text-sm">{t("onboarding.skip")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
