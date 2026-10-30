import React from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export interface EntryTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  avatar?: React.ReactNode;
  minHeight?: number;
  autoFocus?: boolean;
  multiline?: boolean;
  scrollEnabled?: boolean;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function EntryTextInput({
  value,
  onChangeText,
  placeholder = "O que está acontecendo agora?",
  placeholderTextColor = "#9AA0AA",
  avatar,
  minHeight,
  autoFocus = false,
  multiline = true,
  scrollEnabled = true,
  maxLength,
  className = "",
  inputClassName = "",
  style,
  inputStyle,
}: EntryTextInputProps) {
  return (
    <View
      className={`flex-row items-start ${avatar ? "p-5 gap-3" : "p-4"} ${className}`}
      style={style}
    >
      {avatar && <View className="mt-0.5">{avatar}</View>}
      <View className="flex-1 h-full">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          multiline={multiline}
          scrollEnabled={scrollEnabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={`flex-1 p-0 text-base ${inputClassName}`}
          style={[
            styles.input,
            minHeight ? { minHeight } : null,
            inputStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    textAlignVertical: "top",
    color: "#16181D",
    fontSize: 16,
    lineHeight: 22,
  },
});

export default EntryTextInput;
