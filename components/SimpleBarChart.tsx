import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface BarChartData {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarChartData[];
  height?: number;
  showValues?: boolean;
}

export default function SimpleBarChart({ 
  data, 
  height = 120, 
  showValues = true 
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(item => item.maxValue));

  return (
    <View style={[styles.container, { height }]}>
      {data.map((item, index) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
        const barColor = item.color || Colors.primary;
        
        return (
          <View key={index} style={styles.barContainer}>
            {showValues && (
              <Text style={styles.valueText}>{item.value}</Text>
            )}
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: barHeight,
                    backgroundColor: barColor,
                  }
                ]} 
              />
            </View>
            <Text style={styles.labelText}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '80%',
    maxWidth: 40,
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  labelText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
}); 