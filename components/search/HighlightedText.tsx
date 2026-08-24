import { StyleSheet, Text, type TextProps } from 'react-native';

import { AdaptiveColors } from '@/util/theme';

type HighlightedTextProps = TextProps & {
  html: string;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ');

const parseHighlight = (html: string) => {
  const markOnlyHtml = html.replace(/<(?!\/?mark\b)[^>]*>/gi, '');
  const parts = markOnlyHtml.split(/(<mark>.*?<\/mark>)/gi).filter(Boolean);

  return parts.map((part) => {
    const highlighted = /^<mark>/i.test(part);
    const text = decodeHtmlEntities(part.replace(/<\/?mark>/gi, ''));
    return { highlighted, text };
  });
};

export function HighlightedText({ html, ...textProps }: HighlightedTextProps) {
  return (
    <Text {...textProps}>
      {parseHighlight(html).map((part, index) => (
        <Text key={`${index}-${part.text}`} style={part.highlighted && styles.highlight}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: AdaptiveColors.accentSoft,
    color: AdaptiveColors.accent,
  },
});
