import React from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const MapViewComponent = ({ region, originCoords, destinationCoords, route }) => {
  return (
    <MapView
      style={{ flex: 1 }}
      region={region}
    >
      {originCoords && (
        <Marker coordinate={originCoords} title="Origen" pinColor="black" />
      )}
      {destinationCoords && (
        <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia" />
      )}
      {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />}
    </MapView>
  );
};

export default MapViewComponent;
