import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { fetchProviders } from '../../lib/fetchProviders';

// Define the Provider type to match the data structure
export type Provider = {
  id: string;
  name: string;
  specialty?: string;
  city?: string;
  // Add other fields as needed
};

export default function ProvidersScreen() {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetchProviders().then(setProviders);
  }, []);

  return (
    <View style={{ padding: 16 }}>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
            <Text>{item.specialty ?? ''} - {item.city ?? ''}</Text>
          </View>
        )}
      />
    </View>
  );
} 