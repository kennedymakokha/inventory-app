import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { useSettings } from "../../context/SettingsContext";
import { Theme } from "../../utils/theme";

const PieChartColoredSlices = ({ data, title }: any) => {
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const total = data.reduce((sum: number, item: any) => sum + item.value, 0);

  const animatedValues = useRef<Animated.Value[]>([]);

  if (animatedValues.current.length !== data.length) {
    animatedValues.current = data.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    const animations = animatedValues.current.map((anim, index) =>
      Animated.timing(anim, {
        toValue: (data[index].value / total) * 360,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.stagger(150, animations).start();
  }, [data]);

  const colors = ["#ef4444", "#22c55e", "#3b82f6", "#facc15", "#a855f7"]; // Tailwind red, green, blue, yellow, purple

  const size = 160;
  const radius = size / 2;

  let cumulative = 0;

  return (
    <View className="p-4 rounded-xl items-center" style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "600", marginBottom: 16 }}>{title}</Text>

      <View style={{ width: size, height: size, position: "relative" }}>
        {data.map((item: any, index: number) => {
          const rotateStart = cumulative;
          const sliceAngle = (item.value / total) * 360;
          cumulative += sliceAngle;

          const animValue = animatedValues.current[index];
          if (!animValue) return null;

          return (
            <Animated.View
              key={index}
              style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: radius,
                backgroundColor: colors[index % colors.length],
                clipPath: "polygon(50% 50%, 100% 0, 100% 100%)", // mask slice (works in web, RN needs alternative)
                transform: [
                  {
                    rotate: animValue.interpolate({
                      inputRange: [0, 360],
                      outputRange: [`${rotateStart}deg`, `${cumulative}deg`],
                    }),
                  },
                ],
              }}
            />
          );
        })}

        {/* Inner donut */}
        <View
          style={{
            position: "absolute",
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
            top: size * 0.2,
            left: size * 0.2,
            backgroundColor: theme.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>{total}</Text>
        </View>
      </View>

      {/* Legend */}
      <View className="mt-4 w-full">
        {data.map((item: any, index: number) => (
          <View key={index} className="flex-row items-center mb-2">
            <View style={{ width: 16, height: 16, borderRadius: 4, marginRight: 8, backgroundColor: colors[index % colors.length] }} />
            <Text style={{ color: theme.text }}>{item.key}: {item.value} ({Math.round((item.value / total) * 100)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PieChartColoredSlices;