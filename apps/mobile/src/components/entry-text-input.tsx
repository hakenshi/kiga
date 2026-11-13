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

}: EntryTextInputProps) {
  return (

  );
}

