import 'react-native-get-random-values';
import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import MapComponent from './MapComponent';
import DirectionModal from './DirectionModal';
import VehicleSelectionModal from './VehicleSelectionModal';

const GooglePlacesInput = () => {
  const [isDirectionModalVisible, setDirectionModalVisible] = useState(false); // Inicializado en false
  const [isVehicleModalVisible, setVehicleModalVisible] = useState(false); // Inicializado en false
  const [suggestions, setSuggestions] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [servicePrices] = useState({
    economico: 10,
    confort: 20,
    camioneta: 30,
  });
  const [markerCoords, setMarkerCoords] = useState(null);

  const openDirectionModal = () => {
    setDirectionModalVisible(true);
  };

  const openVehicleModal = () => {
    setVehicleModalVisible(true);
  };

  const selectSuggestion = async (description, placeId, isOrigin) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=YOUR_API_KEY`);
      const data = await response.json();

      if (data.result) {
        const { geometry } = data.result;
        const { location } = geometry;

        setMarkerCoords({
          latitude: location.lat,
          longitude: location.lng,
        });

        if (isOrigin) {
          setOrigin(description);
        } else {
          setDestination(description);
        }

        // Cierra el modal y limpia las sugerencias
        setDirectionModalVisible(false);
        setSuggestions([]); // Limpia las sugerencias
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const getRoute = () => {
    console.log('Obteniendo ruta desde:', origin, 'hasta:', destination);
  };

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    console.log("Consultando API con:", query);

    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=YOUR_API_KEY`);
      const data = await response.json();
      console.log("Respuesta de la API:", data);

      if (data.predictions) {
        setSuggestions(data.predictions);
        console.log(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleConfirm = () => {
    // Aquí puedes manejar la lógica de confirmación si es necesario
    console.log('Confirmando selección de origen y destino');
    setDirectionModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#cb2daa"/>
      <MapComponent 
        openDirectionModal={openDirectionModal} 
        openVehicleModal={openVehicleModal} 
        markerCoords={markerCoords} 
        origin={origin}
        destination={destination}
      />
      
      <DirectionModal
        visible={isDirectionModalVisible}
        onClose={() => setDirectionModalVisible(false)} // Asegúrate de que esta función esté definida
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        suggestions={suggestions}
        selectSuggestion={selectSuggestion}
        getRoute={getRoute}
        fetchSuggestions={fetchSuggestions}
        onConfirm={handleConfirm}
      />

      <VehicleSelectionModal
        visible={isVehicleModalVisible}
        onClose={() => setVehicleModalVisible(false)} // Asegúrate de que esta función esté definida
        handleVehicleSelection={() => {}}
        servicePrices={servicePrices}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default GooglePlacesInput;
