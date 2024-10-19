import React from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';

const VehicleSelectionModal = ({ visible, onClose, handleVehicleSelection, servicePrices }) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text>Selecciona un vehículo</Text>
        <Button title="Económico" onPress={() => handleVehicleSelection('economico')} />
        <Button title="Confort" onPress={() => handleVehicleSelection('confort')} />
        <Button title="Camioneta" onPress={() => handleVehicleSelection('camioneta')} />
        <Button title="Cerrar" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VehicleSelectionModal;
