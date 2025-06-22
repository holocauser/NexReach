import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Linking, Platform, TouchableOpacity } from 'react-native';

const GOOGLE_API_KEY = 'AIzaSyAnq_9RS1M8XG2dnihSttcw4EljE9HaoLM'; // Replace with your real key

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [profession, setProfession] = useState('doctor');

  const searchProfessionals = async () => {
    const location = 'Orlando';
    const keyword = `${profession} ${query}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      keyword + ' in ' + location
    )}&key=${GOOGLE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Error fetching places:', err);
    }
  };

  const openMap = (address) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18 }}>Find a {profession}</Text>

      <View style={{ flexDirection: 'row', marginVertical: 10 }}>
        <TouchableOpacity onPress={() => setProfession('doctor')} style={{ marginRight: 20 }}>
          <Text style={{ fontWeight: profession === 'doctor' ? 'bold' : 'normal' }}>Doctor</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setProfession('attorney')}>
          <Text style={{ fontWeight: profession === 'attorney' ? 'bold' : 'normal' }}>Attorney</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search by specialty, language, etc."
        value={query}
        onChangeText={setQuery}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 5,
          padding: 10,
          marginBottom: 10,
        }}
      />

      <Button title="Search" onPress={searchProfessionals} />
      <Button title="Scan Business Card" onPress={() => navigation.navigate('Scan')} />

      <FlatList
        data={results}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openMap(item.formatted_address)} style={{ marginVertical: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
            <Text>{item.formatted_address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
