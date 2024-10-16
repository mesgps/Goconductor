import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={toggleBottomSheet}>
        <Text style={styles.buttonText}>Vehículos</Text>
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.overlay}>
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
            <Text style={styles.sheetTitle}>Menú de Vehículos</Text>
            <Text style={styles.sheetContent}>Contenido del menú aquí...</Text>
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
});

export default BottomSheetMenu;