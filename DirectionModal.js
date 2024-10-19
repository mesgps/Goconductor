import React from 'react';
import { Modal, View, Text, Button, TextInput, FlatList, StyleSheet } from 'react-native';

const DirectionModal = ({ visible, onClose, origin, setOrigin, destination, setDestination, suggestions, selectSuggestion, getRoute, fetchSuggestions, onConfirm }) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text>Origen</Text>
        <TextInput
          value={origin}
          onChangeText={setOrigin}
          onFocus={() => fetchSuggestions(origin)}
          placeholder="Ingresa el origen"
        />
        <Text>Destino</Text>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          onFocus={() => fetchSuggestions(destination)}
          placeholder="Ingresa el destino"
        />
        <Button title="Confirmar" onPress={onConfirm} />
        <Button title="Cerrar" onPress={onClose} />
        <FlatList
          data={suggestions}
          renderItem={({ item }) => (
            <Button title={item.description} onPress={() => selectSuggestion(item.description, item.place_id, true)} />
          )}
          keyExtractor={(item) => item.place_id}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default DirectionModal;
