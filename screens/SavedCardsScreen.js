import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';

const API_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:GQ_2c5hk/business_card'; // your real Xano GET URL

export default function SavedCardsScreen() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setCards(data);
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Saved Business Cards</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text>{item.email}</Text>
              <Text>{item.phone}</Text>
              <Text>{item.company}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
