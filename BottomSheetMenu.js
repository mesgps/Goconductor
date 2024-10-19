import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
// Importa el ícono del carro
import carIcon from './assets/migo.png'; // Asegúrate de que la ruta sea correcta

const BottomSheetMenu = () => {
  const [isVisible, setIsVisible] = useState(false);
  const translateY = new Animated.Value(300); // Inicialmente fuera de la pantalla

  const toggleBottomSheet = () => {
    if (isVisible) {
      Animated.timing(translateY, {
        toValue: 300, // Mover hacia abajo
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    } else {
      setIsVisible(true);
      Animated.timing(translateY, {
        toValue: 0, // Mover hacia arriba
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Lista de carros en ubicaciones ficticias
  const cars = [
    { id: 1, name: 'Carro 1', location: 'Ubicación A' },
    { id: 2, name: 'Carro 2', location: 'Ubicación B' },
    { id: 3, name: 'Carro 3', location: 'Ubicación C' },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={toggleBottomSheet}>
        <Text style={styles.buttonText}>Menú</Text>
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.overlay}>
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
            <Text style={styles.sheetTitle}>Opciones del Menú</Text>
            {/* Agregar marcadores con el ícono de carro y la lista de carros */}
            {cars.map(car => (
              <View key={car.id} style={styles.markerContainer}>
                <Image source={carIcon} style={styles.markerIcon} />
                <Text style={styles.sheetContent}>{car.name} - {car.location}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Asegúrate de que el contenido esté al final
  },
  button: {
    backgroundColor: '#cb2daa',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    position: 'absolute', // Hacer que el botón esté superpuesto
    bottom: 20, // Ajusta la posición del botón
    left: '50%', // Centrar horizontalmente
    transform: [{ translateX: -50 }], // Ajustar para centrar
    zIndex: 10, // Asegúrate de que el botón esté por encima
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo oscuro semi-transparente
    justifyContent: 'flex-end',
    zIndex: 5, // Asegúrate de que el overlay esté por encima
  },
  bottomSheet: {
    backgroundColor: 'white',
    padding: 20,
    height: 300, // Ajusta la altura según sea necesario
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sheetContent: {
    marginTop: 10,
    fontSize: 16,
  },
  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  markerIcon: {
    width: 20, // Ajusta el tamaño según sea necesario
    height: 20,
    marginRight: 10,
  },
});

export default BottomSheetMenu;
