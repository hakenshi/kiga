import React from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
} from "react-native";

export interface EntryTextInputProps extends Omit<TextInputProps, "style"> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  minHeight?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function EntryTextInput({
  value,
  onChangeText,
  placeholder = "O que está acontecendo agora?",
  placeholderTextColor = "#9AA0AA",
  minHeight,
  autoFocus = false,
  multiline = true,
  scrollEnabled = true,
  maxLength,
  className = "",
  style,
  ...rest
}: EntryTextInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      multiline={multiline}
      scrollEnabled={scrollEnabled}
      autoFocus={autoFocus}
      maxLength={maxLength}
      className={`flex-1 p-0 text-base ${className}`}
      style={[styles.input, minHeight ? { minHeight } : null, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    textAlignVertical: "top",
    color: "#16181D",
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 13,
    paddingBottom: 0,
  },
});

export default EntryTextInput;
