import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/Colors';

interface TagListProps {
  tags: string[];
  style?: ViewStyle;
  maxTags?: number;
  onPress?: (tag: string) => void;
}

const TagList: React.FC<TagListProps> = ({ 
  tags, 
  style, 
  maxTags = 3,
  onPress
}) => {
  const displayTags = (tags || []).slice(0, maxTags);
  const hasMore = (tags || []).length > maxTags;
  
  return (
    <View style={[styles.container, style]}>
      {displayTags.map((tag, index) => (
        <View key={index} style={styles.tag}>
          <Text 
            style={styles.tagText}
            onPress={onPress ? () => onPress(tag) : undefined}
          >
            {tag}
          </Text>
        </View>
      ))}
      
      {hasMore && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>+{(tags || []).length - maxTags} more</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
});

export default TagList;