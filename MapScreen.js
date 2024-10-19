import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import DirectionModal from './DirectionModal'; // Asegúrate de que la ruta sea correcta
import VehicleSelectionModal from './VehicleSelectionModal'; // Asegúrate de que la ruta sea correcta

const MapScreen = () => {
  const [isDirectionModalVisible, setDirectionModalVisible] = useState(false);
  const [isVehicleModalVisible, setVehicleModalVisible] = useState(false);

  const openDirectionModal = () => {
    setDirectionModalVisible(true);
  };

  const openVehicleModal = () => {
    setVehicleModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text>Pantalla del Mapa</Text>
      <Button title="Abrir Modal de Direcciones" onPress={openDirectionModal} />
      <Button title="Seleccionar Vehículo" onPress={openVehicleModal} />

      <DirectionModal
        visible={isDirectionModalVisible}
        onClose={() => setDirectionModalVisible(false)}
        // Agrega las props necesarias aquí
      />

      <VehicleSelectionModal
        visible={isVehicleModalVisible}
        onClose={() => setVehicleModalVisible(false)}
        // Agrega las props necesarias aquí
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapScreen;
