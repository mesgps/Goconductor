import 'react-native-get-random-values'; // Agregar esta línea
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import MapComponent from './MapComponent'; // Asegúrate de que la ruta sea correcta
import ModalComponent from './ModalComponent'; // Importa el modal

const GooglePlacesInput = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#cb2daa" />
      <MapComponent />
      <ModalComponent /> 
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Asegúrate de que el fondo sea transparente
  },
});

export default GooglePlacesInput;
