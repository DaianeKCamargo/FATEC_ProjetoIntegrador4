import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminLayout() {
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFE]" edges={["top"]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#F8FAFE",
          },
        }}
      />
    </SafeAreaView>
  );
}