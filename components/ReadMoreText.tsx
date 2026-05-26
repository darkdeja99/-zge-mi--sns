import { useState } from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
} from "react-native";

interface ReadMoreTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
}

export default function ReadMoreText({ text, style }: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 150;

  return (
    <View>
      <Text
        style={style || styles.sectionContent}
        numberOfLines={isExpanded ? undefined : 4}
      >
        {text}
      </Text>
      {isLong && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.readMoreText}>
            {isExpanded ? "Daha Az Göster" : "Devamını Oku"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContent: { fontSize: 16, color: "#ddd" },
  readMoreText: {
    color: "#4DA8DA",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
});
