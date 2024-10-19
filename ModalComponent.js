import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity, Text, TextInput, FlatList, Image, Alert, PanResponder, TouchableWithoutFeedback } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import MapViewDirections from 'react-native-maps-directions';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Importar el Drawer Navigator
import { NavigationContainer } from '@react-navigation/native'; // Importar el Navigation Container
import UserProfile from './UserProfile'; // Asegúrate de que la ruta sea correcta
import MapScreen from './MapScreen'; // Asegúrate de que la ruta sea correcta
import Icon from 'react-native-vector-icons/Ionicons'; // Importar el ícono

const GOOGLE_PLACES_API_KEY = 'AIzaSyBEXEiaXcTjsnI4I1rAQtKgpZbqwYygzps'; // Reemplaza con tu clave de API
const GOOGLE_DIRECTIONS_API_KEY = 'AIzaSyBEXEiaXcTjsnI4I1rAQtKgpZbqwYygzps'; // Reemplaza con tu clave de API para Directions

const Drawer = createDrawerNavigator(); // Crear el Drawer

const MapComponent = ({ navigation }) => { // Asegúrate de recibir la prop navigation
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false); // Estado para controlar la pestaña
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null); // Coordenadas del origen
  const [destinationCoords, setDestinationCoords] = useState(null); // Coordenadas del destino
  const [suggestions, setSuggestions] = useState([]); // Lista de sugerencias
  const [vehicleLocations, setVehicleLocations] = useState([]);
  const [route, setRoute] = useState(null); // Para almacenar la ruta
  const [isSearching, setIsSearching] = useState(false); // Estado para controlar la búsqueda
  const [activeField, setActiveField] = useState(''); // Campo activo (origen o destino)
  const [selectedCoords, setSelectedCoords] = useState(null); // Coordenadas seleccionadas para confirmar
  const [showVehicleModal, setShowVehicleModal] = useState(false); // Modal para seleccionar vehículo
  const [showSearchingModal, setShowSearchingModal] = useState(false); // Modal de búsqueda de conductor
  const [vehicleType, setVehicleType] = useState(null); // Tipo de vehículo seleccionado
  const [servicePrices, setServicePrices] = useState({}); // Precios de los servicios
  const [currentLocation, setCurrentLocation] = useState(null); // Estado para almacenar la ubicación actual

  const [buttonPosition, setButtonPosition] = useState({ x: 100, y: 600 }); // Posición inicial del botón en la parte inferior

  const [showRouteModal, setShowRouteModal] = useState(false); // Estado para mostrar el modal de la ruta

  const [markerCoords, setMarkerCoords] = useState(null); // Coordenadas del marcador

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        setButtonPosition({
          x: buttonPosition.x + gestureState.dx,
          y: buttonPosition.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {
        // Aquí puedes manejar la lógica al soltar el botón si es necesario
      },
    })
  ).current;

  const panResponderBottomSheet = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 10; // Solo iniciar el gesto si se desliza hacia abajo
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) { // Si se desliza hacia abajo más de 50 píxeles
          setShowBottomSheet(false); // Cerrar la pestaña
        }
      },
    })
  ).current;

  const mapRef = useRef(null); // Referencia al mapa

  useEffect(() => {
    // Obtener la ubicación actual al cargar el componente
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Establecer la región del mapa
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Establecer las coordenadas del marcador
      setMarkerCoords({ latitude, longitude });
    })();
  }, []);

  const onRegionChangeComplete = (region) => {
    setRegion(region); // Actualiza la región del mapa
    // Actualiza las coordenadas del marcador a la nueva región
    setMarkerCoords({ latitude: region.latitude, longitude: region.longitude });
  };

  const onDragEnd = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_PLACES_API_KEY}`);
    const data = await response.json();
    const address = data.results[0].formatted_address;

    // Actualiza la dirección según el marcador
    if (activeField === 'origin') {
      setOrigin(address); // Establecer la dirección de origen
      setOriginCoords({ latitude, longitude }); // Establecer coordenadas de origen
    } else if (activeField === 'destination') {
      setDestination(address); // Establecer la dirección de destino
      setDestinationCoords({ latitude, longitude }); // Establecer coordenadas de destino
    }
  };

  const fetchSuggestions = async (query) => {
    if (query.length > 2) {
      setIsSearching(true); // Inicia la búsqueda
      try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
          params: {
            input: query,
            key: GOOGLE_PLACES_API_KEY,
            components: 'country:VE', // Restringir a Venezuela y Ciudad Acarigua
          },
        });
        setSuggestions(response.data.predictions); // Actualiza la lista de sugerencias

        // Agregar ubicación actual a las sugerencias si es para origen
        if (activeField === 'origin' && currentLocation) {
          setSuggestions(prevSuggestions => [
            { description: "Mi Ubicación", place_id: 'current_location' }, // Agregar ubicación actual con el nuevo nombre
            ...prevSuggestions,
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setSuggestions([]); // Limpia las sugerencias si la consulta es corta
      setIsSearching(false); // Detiene la búsqueda
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
        params: {
          place_id: placeId,
          key: GOOGLE_PLACES_API_KEY,
        },
      });
      return response.data.result.geometry.location; // Devuelve las coordenadas de la ubicación
    } catch (error) {
      console.error(error);
    }
  };

  const selectSuggestion = async (description, placeId) => {
    if (placeId === 'current_location') {
      // Si se selecciona la ubicación actual
      setOrigin(currentLocation.address); // Establecer la dirección de origen como la ubicación actual
      setOriginCoords(currentLocation); // Establecer las coordenadas de origen
      setDestination(''); // Limpia el campo de destino
      setActiveField('destination'); // Cambia el campo activo a destino
    } else {
      const location = await getPlaceDetails(placeId); // Obtiene las coordenadas de la dirección seleccionada
      setSelectedCoords({ latitude: location.lat, longitude: location.lng }); // Establece las coordenadas seleccionadas
      setRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.005, // Zoom más cercano
        longitudeDelta: 0.005,
      }); // Mueve el mapa a la ubicación seleccionada
      if (activeField === 'origin') {
        setOrigin(description); // Carga la dirección seleccionada en el campo de origen
        setDestination(''); // Limpia el campo de destino
        setOriginCoords({ latitude: location.lat, longitude: location.lng }); // Establece las coordenadas de origen
      } else if (activeField === 'destination') {
        setDestination(description); // Carga la dirección seleccionada en el campo de destino
        setDestinationCoords({ latitude: location.lat, longitude: location.lng }); // Establece las coordenadas de destino
      }
    }
    setSuggestions([]); // Limpia las sugerencias
    setIsSearching(false); // Detiene la búsqueda al seleccionar una sugerencia
    // No cerrar el modal si se selecciona "Mi Ubicación"
    if (placeId !== 'current_location') {
      setShowDirectionModal(false); // Cierra el modal solo si no es "Mi Ubicación"
    }
  };

  const confirmLocation = () => {
    // Alejar el mapa al confirmar
    if (originCoords && destinationCoords) {
      const midPoint = {
        latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
        longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
      };
      setRegion({
        latitude: midPoint.latitude,
        longitude: midPoint.longitude,
        latitudeDelta: 0.05, // Alejar el zoom
        longitudeDelta: 0.05,
      });
    }
    setSelectedCoords(null); // Limpia las coordenadas seleccionadas
    setShowDirectionModal(true); // Reabre el modal para permitir más ajustes
  };

  const getRoute = async () => {
    if (!origin || !destination) {
      Alert.alert("Error", "Por favor, ingresa tanto la dirección de origen como la de destino.");
      return; // Detiene la ejecución si no hay direcciones
    }

    if (originCoords && destinationCoords) {
      try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
          params: {
            origin: `${originCoords.latitude},${originCoords.longitude}`,
            destination: `${destinationCoords.latitude},${destinationCoords.longitude}`,
            key: GOOGLE_DIRECTIONS_API_KEY,
          },
        });
        const points = response.data.routes[0].legs[0].steps.map(step => {
          return {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          };
        });
        setRoute(points);

        // Calcular la distancia
        const distance = response.data.routes[0].legs[0].distance.value; // Distancia en metros
        calculateServicePrices(distance); // Calcular precios según la distancia

        // Centrar el mapa en la ruta y alejar el zoom
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
            longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
            latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5, // Ajusta el zoom
            longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5, // Ajusta el zoom
          }, 1000); // Duración de la animación en milisegundos
        }

        // Cerrar la pestaña despus de buscar
        setShowBottomSheet(false);

        setShowDirectionModal(false);
        setShowVehicleModal(true); // Abre el modal de selección de vehículo

        // Mostrar el modal de la ruta
        setShowRouteModal(true);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const calculateServicePrices = (distance) => {
    const basePrices = {
      economico: 2.5,
      confort: 3.0,
      camioneta: 4.0,
    };

    // Ajustar precios según la distancia (por ejemplo, $0.01 por cada 100 metros)
    const distanceInKm = distance / 1000; // Convertir a kilómetros
    const priceMultiplier = 0.25; // Ajuste por kilómetro

    const adjustedPrices = {
      economico: (basePrices.economico + distanceInKm * priceMultiplier).toFixed(2),
      confort: (basePrices.confort + distanceInKm * priceMultiplier).toFixed(2),
      camioneta: (basePrices.camioneta + distanceInKm * priceMultiplier).toFixed(2),
    };

    setServicePrices(adjustedPrices); // Actualiza los precios de los servicios
  };

  const handleVehicleSelection = (type) => {
    setVehicleType(type);
    setShowVehicleModal(false); 
    setShowSearchingModal(true); 

    setTimeout(() => {
      Alert.alert("No se encontraron conductores cercanos", "Intenta nuevamente más tarde.", [
        { text: "Aceptar", onPress: () => setShowSearchingModal(false) }
      ]);
    }, 15000); 
  };

  const onMarkerDragEnd = (e, type) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (type === 'origin') {
      setOriginCoords({ latitude, longitude });
    } else if (type === 'destination') {
      setDestinationCoords({ latitude, longitude });
    }
  };

  const handleStickerPress = () => {
    setShowDirectionModal(true); 
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuButton} onPress={() => navigation && navigation.openDrawer()}>
        <Icon name="menu" size={30} color="#fff" />
      </TouchableOpacity>

      <MapView
        ref={mapRef} // Asignar la referencia al mapa
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete} // Mover el mapa
      >
        {markerCoords && (
          <Marker 
            coordinate={markerCoords} // Mantener el marcador en la ubicación actual
            title="Ubicación Actual" 
            pinColor="black" 
            draggable 
            onDragEnd={onDragEnd} // Agregar evento onDragEnd
          />
        )}
        {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />}
      </MapView>

      <TouchableOpacity onPress={handleStickerPress} style={styles.stickerButton}>
        <Image source={require('./assets/tocame.gif')} style={styles.stickerImage}/>
      </TouchableOpacity>

      <Modal visible={showDirectionModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setShowDirectionModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <View style={styles.inputContainer}>
                <View style={styles.pointWhite}/>
                <TextInput
                  placeholder="Dirección de Origen"
                  style={styles.input}
                  value={origin}
                  onChangeText={(text) => {
                    setOrigin(text);
                    setActiveField('origin');
                    fetchSuggestions(text);
                  }}/>
                {origin.length > 0 && (
                  <TouchableOpacity onPress={() => setOrigin('')} style={styles.closeButton}>
                    <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => {
                  // Lógica para obtener la ubicación actual
                  setOrigin(currentLocation.address); // Establecer la dirección de origen como la ubicación actual
                  setOriginCoords(currentLocation); // Establecer las coordenadas de origen
                }} style={styles.radarButton}>
                  <Image source={require('./assets/radar.png')} style={styles.radarImage} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <View style={styles.pointFuchsia} />
                <TextInput
                  placeholder="Dirección de Destino"
                  style={styles.input}
                  value={destination}
                  onChangeText={(text) => {
                    setDestination(text);
                    setActiveField('destination');
                    fetchSuggestions(text);
                  }}
                />
                {destination.length > 0 && (
                  <TouchableOpacity onPress={() => setDestination('')} style={styles.closeButton}>
                    <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
                  </TouchableOpacity>
                )}
              </View>
              {suggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => selectSuggestion(item.description, item.place_id)}>
                        <Text style={styles.suggestionText}>{item.description}</Text>
                      </TouchableOpacity>
                    )}/>
                </View>
              )}
              <TouchableOpacity style={styles.goButton} onPress={getRoute}>
                <Text style={styles.goButtonText}>Buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showVehicleModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setShowVehicleModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.vehicleModal}>
              <Text style={styles.modalTitle}>Selecciona un tipo de vehículo</Text>
              <TouchableOpacity style={styles.vehicleOption} onPress={() => handleVehicleSelection('economico')}>
                <Image source={require('./assets/migo.png')} style={styles.vehicleImage}/>
                <Text style={styles.vehicleText}>Económico - ${servicePrices.economico}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.vehicleOption} onPress={() => handleVehicleSelection('confort')}>
                <Image source={require('./assets/migo.png')} style={styles.vehicleImage}/>
                <Text style={styles.vehicleText}>Confort - ${servicePrices.confort}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.vehicleOption} onPress={() => handleVehicleSelection('camioneta')}>
                <Image source={require('./assets/migo.png')} style={styles.vehicleImage}/>
                <Text style={styles.vehicleText}>Camioneta - ${servicePrices.camioneta}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showSearchingModal} transparent={true}>
        <View style={styles.searchingModal}>
          <Text style={styles.searchingText}>Buscando conductor más cercano...</Text>
          <Image source={require('./assets/mascota.gif')} style={styles.searchingImage}/>
        </View>
      </Modal>

      {selectedCoords && (
        <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      )}

      {/* Pestaña que se abre hacia arriba */}
      {showBottomSheet && (
        <View style={styles.bottomSheet} {...panResponderBottomSheet.panHandlers}>
          <View style={styles.inputContainer}>
            <View style={styles.pointWhite} />
            <TextInput
              placeholder="Dirección de Origen"
              style={styles.input}
              value={origin}
              onChangeText={(text) => {
                setOrigin(text);
                setActiveField('origin');
                fetchSuggestions(text);
              }}
            />
            {origin.length > 0 && (
              <TouchableOpacity onPress={() => setOrigin('')} style={styles.closeButton}>
                <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.pointFuchsia} />
            <TextInput
              placeholder="Dirección de Destino"
              style={styles.input}
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                setActiveField('destination');
                fetchSuggestions(text);
              }}
            />
            {destination.length > 0 && (
              <TouchableOpacity onPress={() => setDestination('')} style={styles.closeButton}>
                <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Lista de sugerencias única */}
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => {
                  if (activeField === 'origin') {
                    setOrigin(item.description);
                  } else if (activeField === 'destination') {
                    setDestination(item.description);
                  }
                  setSuggestions([]); // Limpiar sugerencias al seleccionar
                }}>
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          {/* Botón "Buscar" visible solo si ambos campos tienen contenido */}
          {origin.length > 0 && destination.length > 0 && (
            <TouchableOpacity style={styles.goButton} onPress={getRoute}>
              <Text style={styles.goButtonText}>Buscar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal para mostrar la ruta */}
      <Modal visible={showRouteModal} animationType="slide">
        <View style={styles.modalContainer}>
          {originCoords && destinationCoords && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
                longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5,
                longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5,
              }}
            >
              <Marker coordinate={originCoords} title="Origen" pinColor="black" />
              <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia" />
              {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />}
            </MapView>
          )}
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowRouteModal(false)}>
            <Text style={styles.closeModalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Botón para abrir la pestaña */}
      {!showBottomSheet && (
        <TouchableOpacity style={styles.openButton} onPress={() => setShowBottomSheet(true)}>
          <Text style={styles.openButtonText}>Abrir Pestaña</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Fondo oscuro
  },
  map: {
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fondo semitransparente
    borderRadius: 5,
    padding: 10,
    elevation: 5,
    zIndex: 1, // Asegúrate de que el botón esté por encima
  },
  movableButton: {
    position: 'absolute',
    backgroundColor: '#cb2daa',
    padding: 10,
    borderRadius: 50,
    elevation: 5,
    width: 200, 
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente
  },
  modalView: {
    width: '96%', // Ajusta el ancho del modal
    maxHeight: '30%', // Limita la altura máxima del modal
    backgroundColor: '#1E1E1E', // Fondo oscuro
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row', // Alinear elementos en fila
    alignItems: 'center', // Centrar verticalmente
    width: '100%',
    backgroundColor: '#1E1E1E', // Fondo oscuro
    borderRadius: 10, // Bordes redondeados
    padding: 10,
    marginBottom: 1,
  },
  pointWhite: {
    width: 10,
    height: 10,
    borderRadius: 5, // Hacerlo circular
    backgroundColor: 'white', // Color blanco
    marginRight: 10, // Espacio entre el punto y la caja de texto
  },
  pointFuchsia: {
    width: 10,
    height: 10,
    borderRadius: 5, // Hacerlo circular
    backgroundColor: 'fuchsia', // Color fucsia
    marginRight: 10, // Espacio entre el punto y la caja de texto
  },
  input: {
    height: 50,
    borderColor: '#ccc', // Color del borde
    borderWidth: 1,
    borderRadius: 10, // Bordes redondeados
    paddingHorizontal: 15,
    fontSize: 16, // Tamaño de la fuente
    color: '#000000', // Color del texto (negro)
    backgroundColor: '#FFFFFF', // Fondo de la caja de texto (blanco)
    flex: 1, // Para que ocupe el espacio restante
  },
  suggestionBox: {
    maxHeight: 350, // Limitar la altura de la caja de sugerencias
    width: '100%', // Ancho completo
    backgroundColor: '#1E1E1E', // Fondo oscuro
    borderRadius: 15, // Bordes redondeados
    padding: 10,
    elevation: 1, // Sombra para la caja de sugerencias
  },
  suggestionText: {
    padding: 8,
    backgroundColor: '#333333', // Color de fondo de las sugerencias
    borderBottomWidth: 1,
    borderBottomColor: '#444444', // Color del borde inferior
    fontSize: 14, // Tamaño de la fuente
    color: '#ffffff', // Color del texto
  },
  goButton: {
    backgroundColor: '#cb2daa',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%', // Ajusta el ancho según sea necesario
    alignItems: 'center', // Centrar el texto
    elevation: 5, // Sombra
  },
  goButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18, // Tamaño de la fuente
    fontWeight: 'bold', // Negrita
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  confirmButton: {
    backgroundColor: '#cb2daa',
    padding: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: 20, // Ajusta la posición según sea necesario
    left: '50%',
    transform: [{ translateX: -50 }],
    width: '80%', // Ajusta el ancho según sea necesario
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  vehicleModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 6, 129, 0.7)', // Fondo semitransparente
    padding: 10,
    borderRadius: 50,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: 'white',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 15,
    marginVertical: 10,
    width: '80%',
  },
  vehicleImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  vehicleText: {
    fontSize: 18,
  },
  searchingModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente
    padding: 20,
  },
  searchingText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20, // Espacio entre el texto y la imagen
  },
  searchingImage: {
    width: 100, // Ajusta el tamaño según sea necesario
    height: 100, // Ajusta el tamaño según sea necesario
  },
  stickerButton: {
    position: 'absolute',
    bottom: 50, // Ajusta la posición según sea necesario
    right: 130, // Ajusta la posición según sea necesario
  },
  stickerImage: {
    width: 120, // Ajusta el tamaño según sea necesario
    height: 200, // Ajusta el tamaño según sea necesario
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%', // Altura de la pestaña
    backgroundColor: '#1E1E1E', // Fondo oscuro
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    zIndex: 0, // Asegúrate de que la pestaña esté detrás del botón
  },
  openButton: {
    position: 'absolute',
    bottom: 100, // Ajusta la posición según sea necesario
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    zIndex: 1, // Asegúrate de que el botón esté por encima
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
    padding: 10,
  },
  closeModalButtonText: {
    color: '#000',
    fontSize: 16,
  },
  radarButton: {
    marginLeft: 10, // Espacio entre el campo de texto y el ícono
  },
  radarImage: {
    width: 30, // Ajusta el tamaño según sea necesario
    height: 30, // Ajusta el tamaño según sea necesario
  },
});

// Exportación
export default MapComponent;