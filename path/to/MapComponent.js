import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TextInput, ActivityIndicator, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { debounce } from 'lodash'; // Asegúrate de instalar lodash

const MapComponent = ({ openDirectionModal, openVehicleModal }) => {
  const [region, setRegion] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setMarkerCoords({ latitude, longitude });
      setLoading(false);
    };

    fetchLocation();
  }, []);

  const onRegionChangeComplete = debounce((region) => {
    setRegion(region);
    setMarkerCoords({ latitude: region.latitude, longitude: region.longitude });
  }, 1000); // Debounce de 1 segundo

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {markerCoords && (
          <Marker 
            coordinate={markerCoords} 
            title="Ubicación Actual" 
            pinColor="black" 
          />
        )}
      </MapView>

      <TextInput
        style={styles.input}
        value={address}
        placeholder="Dirección"
        editable={false} // Hacerlo no editable si solo se muestra la dirección
      />

      <View style={styles.buttonContainer}>
        <Button title="Abrir Modal de Direcciones" onPress={openDirectionModal} />
        <Button title="Seleccionar Vehículo" onPress={openVehicleModal} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  input: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    zIndex: 1, // Asegúrate de que el input esté por encima del mapa
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1, // Asegúrate de que el contenedor de botones esté por encima del mapa
  },
});

export default MapComponent;
