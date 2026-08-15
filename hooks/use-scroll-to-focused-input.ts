import { useCallback, useEffect, useRef } from 'react';
import { findNodeHandle, Keyboard, ScrollView, TextInput } from 'react-native';

/** Keeps the complete focused input above the software keyboard. */
export function useScrollToFocusedInput(bottomOffset = 16) {
  const scrollViewRef = useRef<ScrollView>(null);
  const focusedInputRef = useRef<TextInput | null>(null);

  const scrollToFocusedInput = useCallback(() => {
    const inputHandle = findNodeHandle(focusedInputRef.current);
    if (inputHandle === null) return;

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        inputHandle,
        bottomOffset,
        true,
      );
    });
  }, [bottomOffset]);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', scrollToFocusedInput);
    return () => subscription.remove();
  }, [scrollToFocusedInput]);

  const handleInputFocus = useCallback(
    (input: TextInput | null) => {
      focusedInputRef.current = input;
      scrollToFocusedInput();
    },
    [scrollToFocusedInput],
  );

  const handleInputBlur = useCallback((input: TextInput | null) => {
    if (focusedInputRef.current === input) focusedInputRef.current = null;
  }, []);

  return { scrollViewRef, handleInputFocus, handleInputBlur };
}
