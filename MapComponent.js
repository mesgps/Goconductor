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

const MapComponent = ({ navigation }) => { // Asegrate de recibir la prop navigation
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

  const [showStickerButton, setShowStickerButton] = useState(true); // Estado para controlar la visibilidad del sticker

  const [driverLocation, setDriverLocation] = useState(null); // Estado para la ubicación del conductor

  const [showVehicleButton, setShowVehicleButton] = useState(false); // Estado para controlar la visibilidad del botón de vehículos

  const [showProfileModal, setShowProfileModal] = useState(false); // Estado para controlar la visibilidad del modal de perfil

  const [showPaymentForm, setShowPaymentForm] = useState(false); // Estado para mostrar el formulario de pago
  const [amount, setAmount] = useState(''); // Estado para el monto
  const [bankReference, setBankReference] = useState(''); // Estado para la referencia bancaria
  const [depositStatus, setDepositStatus] = useState(''); // Estado para el estado del depósito

  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false); // Estado para mostrar el modal de medios de pago
  const [selectedVehicle, setSelectedVehicle] = useState(null); // Estado para almacenar el vehículo seleccionado

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

  const mapRef = useRef(null); 

  useEffect(() => {
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

      // Obtener la dirección de origen usando geocodificación inversa
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_PLACES_API_KEY,
        },
      });

      if (response.data.results.length > 0) {
        const address = response.data.results[0].formatted_address;
        setCurrentLocation({ latitude, longitude, address }); // Asegúrate de que esto se ejecute solo si hay resultados
        setOrigin(address); // Establecer la dirección de origen
        setOriginCoords({ latitude, longitude }); // Establecer las coordenadas de origen
      } else {
        console.log("No se encontraron resultados de geocodificación");
      }

      setLoading(false);
    })();
  }, []);

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
        console.log("Origen seleccionado:", description); // Log para verificar el origen
    } else if (activeField === 'destination') {
        setDestination(description); // Carga la dirección seleccionada en el campo de destino
        setDestinationCoords({ latitude: location.lat, longitude: location.lng }); // Establece las coordenadas de destino
        console.log("Destino seleccionado:", description); // Log para verificar el destino
    }
    setSuggestions([]); // Limpia las sugerencias
    setIsSearching(false); // Detiene la búsqueda al seleccionar una sugerencia
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
    console.log("Origin Coords:", originCoords); // Verifica las coordenadas de origen
    console.log("Destination Coords:", destinationCoords); // Verifica las coordenadas de destino

    // Asegúrate de que originCoords y destinationCoords no sean null
    if (!originCoords || !destinationCoords) {
        Alert.alert("Error", "Por favor, asegúrate de que las direcciones de origen y destino estén seleccionadas.");
        return; // Detiene la ejecución si no hay direcciones
    }

    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin: `${originCoords.latitude},${originCoords.longitude}`, // Coordenadas de origen
                destination: `${destinationCoords.latitude},${destinationCoords.longitude}`, // Coordenadas de destino
                key: GOOGLE_DIRECTIONS_API_KEY,
            },
        });

        if (response.data.routes.length > 0) {
            const points = response.data.routes[0].legs[0].steps.map(step => {
                return {
                    latitude: step.end_location.lat,
                    longitude: step.end_location.lng,
                };
            });
            setRoute(points); // Establece la ruta

            // Calcular la distancia total de la ruta
            const distance = response.data.routes[0].legs[0].distance.value; // Distancia en metros
            calculateServicePrices(distance); // Llama a la función para calcular precios

            // Centrar el mapa en la ruta y alejar el zoom
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
                    longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                    latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5,
                    longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5,
                }, 1000); // Duración de la animación en milisegundos
            }

            // Cerrar el modal y mostrar el botón de vehículos
            setShowDirectionModal(false); // Cierra el modal de dirección
            setShowVehicleButton(true); // Muestra el botón de vehículos
        } else {
            Alert.alert("Error", "No se pudo encontrar una ruta.");
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo obtener la ruta. Intenta nuevamente.");
    }
  };

  const calculateServicePrices = (distance) => {
    const basePrices = {
        economico: 2.5,
        confort: 3.0,
        camioneta: 4.0,
    };

    const distanceInKm = distance / 1000; 
    const priceMultiplier = 0.41; 

    const adjustedPrices = {
        economico: (basePrices.economico + distanceInKm * priceMultiplier).toFixed(2),
        confort: (basePrices.confort + distanceInKm * priceMultiplier).toFixed(2),
        camioneta: (basePrices.camioneta + distanceInKm * priceMultiplier).toFixed(2),
    };

    setServicePrices(adjustedPrices); 
    console.log("Precios ajustados:", adjustedPrices); 
  };

  const handleVehicleSelection = (vehicle) => {
    setSelectedVehicle(vehicle); 
    setShowPaymentMethodModal(true); 
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
    setShowStickerButton(false); 
  };

  const resetState = () => {
    setOrigin('');
    setDestination('');
    setOriginCoords(null);
    setDestinationCoords(null);
    setRoute(null);
    setShowDirectionModal(false);
    setShowVehicleButton(false);
    setShowVehicleModal(false);
    setShowSearchingModal(false);
    setSuggestions([]);
    setServicePrices({});
    setCurrentLocation(null);
    setShowStickerButton(true);
    
  };

  const handleGetCurrentLocation = async () => {
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permiso de ubicación denegado");
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: {
                latlng: `${latitude},${longitude}`,
                key: GOOGLE_PLACES_API_KEY,
            },
        });

        if (response.data.results.length > 0) {
            const address = response.data.results[0].formatted_address;
            setCurrentLocation({ latitude, longitude, address }); 
            setOrigin(address); 
            setOriginCoords({ latitude, longitude }); 
        } else {
            console.log("No se encontraron resultados de geocodificación");
        }
    } catch (error) {
        console.error("Error al obtener la ubicación:", error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff"/>;
  }

  console.log("Estado de Driver Location antes de renderizar el mapa:", driverLocation);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
          style={styles.redButton} 
          onPress={() => setShowProfileModal(true)}>
          <Text style={styles.redButtonText}>Perfil</Text>
      </TouchableOpacity>

      <View style={styles.balanceContainer}>
          <TouchableOpacity onPress={() => setShowPaymentForm(true)}>
              <Text style={styles.balanceText}>Saldo: $10.0</Text>
          </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
        <Icon name="menu" size={30} color="#fff"/>
      </TouchableOpacity>

      <MapView
        ref={mapRef} 
        style={styles.map}
        region={region}>
        {originCoords && (
          <Marker coordinate={originCoords} title="Origen" pinColor="black"/>
        )}
        {destinationCoords && (
          <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia"/>
        )}
        {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue"/>}
      </MapView>

      {showStickerButton && (
        <TouchableOpacity onPress={handleStickerPress} style={styles.stickerButton}>
          <Image source={require('./assets/tocame.gif')} style={styles.stickerImage}/>
        </TouchableOpacity>)}

      <Modal visible={showDirectionModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => {
            setShowDirectionModal(false);
            setShowStickerButton(true);}}>
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
                    console.log("Texto de origen:", text);
                    fetchSuggestions(text);
                  }}/>
                {origin.length > 0 && (
                  <TouchableOpacity onPress={() => setOrigin('')} style={styles.closeButton}>
                    <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.radarButton}>
                  <Image source={require('./assets/radar.png')} style={styles.radarImage}/>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <View style={styles.pointFuchsia}/>
                <TextInput
                  placeholder="Dirección de Destino"
                  style={styles.input}
                  value={destination}
                  onChangeText={(text) => {
                    setDestination(text);
                    setActiveField('destination');
                    console.log("Texto de destino:", text);
                    fetchSuggestions(text);
                  }}/>
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
              <TouchableOpacity style={styles.goButton} onPress={() => {
                  console.log("Antes de llamar a getRoute, Origin Coords:", originCoords);
                  console.log("Destination Coords:", destinationCoords);
                  getRoute();
              }}>
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
              <View style={styles.vehicleOptionsContainer}> // Nueva vista contenedora
                <TouchableOpacity style={styles.vehicleOption} onPress={() => handleVehicleSelection('economico')}>
                  <Image source={require('./assets/migo.png')} style={styles.vehicleImage}/> 
                  <Text style={styles.vehicleText}>Económico - ${servicePrices.economico ||2.5}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.vehicleOption} onPress={() => handleVehicleSelection('confort')}>
                  <Image source={require('./assets/taxigo.png')} style={styles.vehicleImage}/> 
                  <Text style={styles.vehicleText}>Confort - ${servicePrices.confort ||3.0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.vehicleOption} onPress={() => handleVehicleSelection('camioneta')}>
                  <Image source={require('./assets/top.png')} style={styles.vehicleImage}/>
                  <Text style={styles.vehicleText}>Camioneta - ${servicePrices.camioneta ||4.0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showSearchingModal} transparent={true}>
        <View style={styles.searchingModal}>
          <Image source={require('./assets/migo.png')} style={styles.logoImage}/>
          <Text style={styles.searchingText}>Buscando conductor más cercano...</Text>
          <Image source={require('./assets/mascota.gif')} style={styles.searchingImage}/>
          
          
          <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                  setShowSearchingModal(false);
              }}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {selectedCoords && (
        <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      )}

     
      {showBottomSheet && (
        <View style={styles.bottomSheet} {...panResponderBottomSheet.panHandlers}>
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
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.pointFuchsia}/>
            <TextInput
              placeholder="Dirección de Destino"
              style={styles.input}
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                setActiveField('destination');
                fetchSuggestions(text);
              }}/>
            {destination.length > 0 && (
              <TouchableOpacity onPress={() => setDestination('')} style={styles.closeButton}>
                <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            )}
          </View>
          
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
                  setSuggestions([]); 
                }}>
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}/>
          )}
          {origin.length > 0 && destination.length > 0 && (
            <TouchableOpacity style={styles.goButton} onPress={getRoute}>
              <Text style={styles.goButtonText}>Buscar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      
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
              }}>
              <Marker coordinate={originCoords} title="Origen" pinColor="black"/>
              <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia" />
              {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue"/>}
            </MapView>
          )}
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowRouteModal(false)}>
            <Text style={styles.closeModalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {!showBottomSheet && (
        <TouchableOpacity style={styles.openButton} onPress={() => setShowBottomSheet(true)}>
          <Text style={styles.openButtonText}>prueba</Text>
        </TouchableOpacity>
      )}

      {showVehicleButton && ( 
        <TouchableOpacity 
            style={styles.vehicleButton} 
            onPress={() => {
                setShowVehicleModal(true); 
                setShowVehicleButton(false); 
            }}>
            <Text style={styles.vehicleButtonText}>GO</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showProfileModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
                <Image 
                    source={require('./assets/gogo.gif')}
                    style={styles.profileImage}/>
                <Text style={styles.modalTitle}>Nombre del Usuario</Text>
                <Text style={styles.modalText}>Correo: usuario@example.com</Text>
                <Text style={styles.modalText}>Teléfono: +123456789</Text>
                <TouchableOpacity 
                    style={styles.reloadButton} 
                    onPress={() => setShowPaymentForm(true)}>
                    <Text style={styles.reloadButtonText}>Recargar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setShowProfileModal(false)}>
                    <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      <TouchableOpacity 
          style={styles.resetButton} 
          onPress={resetState}>
          <Text style={styles.resetButtonText}>Prueba 2</Text>
      </TouchableOpacity>

      {showPaymentForm && (
          <Modal visible={showPaymentForm} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                  <View style={styles.paymentModal}>
                      <Text style={styles.modalTitle}>Formulario de Pago</Text>
                      <TextInput
                          placeholder="Monto en $"
                          value={amount}
                          onChangeText={setAmount}
                          keyboardType="numeric"
                          style={styles.input}/>
                      <TextInput
                          placeholder="Referencia Bancaria"
                          value={bankReference}
                          onChangeText={setBankReference}
                          style={styles.input}/>
                      <TouchableOpacity 
                          style={styles.submitButton} 
                          onPress={() => {
                              setDepositStatus('Su depósito fue enviado exitosamente.');
                              
                              
                              setAmount(''); 
                              setBankReference(''); 
                              
                              setShowPaymentForm(false);}}>
                          <Text style={styles.submitButtonText}>Enviar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          style={styles.closeButton} 
                          onPress={() => setShowPaymentForm(false)}>
                          <Text style={styles.closeButtonText}>Cerrar</Text>
                      </TouchableOpacity>
                      {depositStatus && <Text style={styles.depositStatus}>{depositStatus}</Text>}
                  </View>
              </View>
          </Modal>)}

      {showPaymentMethodModal && (
          <Modal visible={showPaymentMethodModal} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                  <View style={styles.paymentMethodModal}>
                      <Text style={styles.modalTitle}>Selecciona un medio de pago</Text>
                      <TouchableOpacity 
                          style={styles.paymentOption} 
                          onPress={() => {
                              setShowPaymentMethodModal(false); 
                              setShowVehicleModal(false); 
                              setShowSearchingModal(true); 
                          }}>
                          <Text style={styles.paymentText}>Billetera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          style={styles.paymentOption} 
                          onPress={() => {
                              setShowPaymentMethodModal(false); 
                              setShowVehicleModal(false); 
                              setShowSearchingModal(true); 
                          }}>
                          <Text style={styles.paymentText}>Pago Móvil</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          style={styles.paymentOption} 
                          onPress={() => {
                              setShowPaymentMethodModal(false); 
                              setShowVehicleModal(false); 
                              setShowSearchingModal(true); 
                          }}>
                          <Text style={styles.paymentText}>Efectivo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                          style={styles.closeButton} 
                          onPress={() => setShowPaymentMethodModal(false)}>
                          <Text style={styles.closeButtonText}>Cerrar</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </Modal>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  map: {
    flex: 1, 
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    width: '98%', // Ajusta el ancho del modal
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
    padding: 5,
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
    fontSize: 12, // Tamaño de la fuente
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
    bottom: 180, // Ajusta la posición según sea necesario
    left: '50%',
    transform: [{ translateX: -50 }],
    width: '30%', // Ajusta el ancho según sea necesario
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  vehicleModal: {
    width: '299', // Ajusta el ancho del modal (puedes usar un valor fijo como 300 o un porcentaje)
    height: '55%', // Ajusta la altura del modal (puedes usar un valor fijo como 400 o un porcentaje)
    justifyContent: 'absolute',
    top: '35%',
    left: '50%',
    transform: [{ translateX: -180 }, { translateY: -100 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.0)', // Fondo semitransparente más oscuro
    padding: 14,
    borderRadius: 20, // Bordes redondeados
    elevation: 0, // Sombra más pronunciada
  },
  modalTitle: {
    fontSize: 16, // Tamaño de fuente más grande
    marginBottom: 20,
    color: '#ffffff', // Color blanco para el texto
    fontWeight: 'bold', // Negrita
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Fondo blanco para las opciones
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    width: '80%',
    elevation: 5, // Sombra para las opciones
  },
  vehicleImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  vehicleText: {
    fontSize: 18,
    color: '#333333', // Color del texto más oscuro
  },
  searchingModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 6, 129, 0.5)', // Fondo semitransparente
    padding: 20,
  },
  searchingText: {
    fontSize: 12,
    color: 'white',
    marginBottom: 20, // Espacio entre el texto y la imagen
  },
  searchingImage: {
    width: 100, // Ajusta el tamaño según sea necesario
    height: 100, // Ajusta el tamaño según sea necesario
  },
  stickerButton: {
    position: 'absolute',
    bottom: 10, // Ajusta la posición según sea necesario
    right: 80, // Ajusta la posición según sea necesario
  },
  stickerImage: {
    width: 220, // Ajusta el tamaño según sea necesario
    height: 400, // Ajusta el tamaño según sea necesario
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '80%', // Altura de la pestaa
    backgroundColor: '#1E1E1E', // Fondo oscuro
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    zIndex: 0, // Asegúrate de que la pestaña est detrás del botón
  },
  openButton: {
    position: 'absolute',
    bottom: 10, // Ajusta la posición según sea necesario
    left: '50%',
    transform: [{ translateX: 100 }],
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
    top: 350, // Cambia esta posición según sea necesario
    right: 150, // Cambia esta posición según sea necesario
    backgroundColor: 'rgba(244, 6, 129, 0.8)', // Fondo semitransparente
    borderRadius: 5,
    padding: 10,
    elevation: 3, // Sombra para el botón
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
  logoImage: {
    width: 100, // Ajusta el tamaño según sea necesario
    height: 100, // Ajusta el tamaño según sea necesario
    marginBottom: 20, // Espacio entre el logo y el texto
  },
  vehicleButton: {
    position: 'absolute',
    bottom: 340, // Ajusta la posición según sea necesario
    left: '60%',
    transform: [{ translateX: -70 }],
    backgroundColor: '#cb2daa',
    padding: 10,
    borderRadius: 25,
  },
  vehicleButtonText: {
    color: 'white',
    fontSize: 50,
  },
  cancelButton: {
    marginTop: 20, // Espacio entre el texto y el botón
    backgroundColor: 'red', // Color de fondo del botón
    padding: 10,
    borderRadius: 5,
    alignItems: 'center', // Centrar el texto
  },
  cancelButtonText: {
    color: 'white', // Color del texto
    fontSize: 16,
  },
  redButton: {
    position: 'absolute',
    top: 40, // Ajusta la posición vertical según sea necesario
    left: 20, // Ajusta la posición horizontal según sea necesario
    backgroundColor: 'red', // Color de fondo del botón
    padding: 10,
    borderRadius: 5,
    elevation: 5, // Sombra para el botón
    zIndex: 1, // Asegúrate de que el botón esté por encima de otros elementos
  },
  redButtonText: {
    color: 'white', // Color del texto
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semi-transparente
  },
  modalView: {
    width: '80%', // Ancho del modal
    backgroundColor: '#fff', // Fondo blanco
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5, // Sombra
  },
  profileImage: {
    width: 100, // Ajusta el tamaño según sea necesario
    height: 100, // Ajusta el tamaño según sea necesario
    borderRadius: 50, // Hacer la imagen redonda
    marginBottom: 10, // Espacio entre la imagen y el texto
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  reloadButton: {
    backgroundColor: '#007BFF', // Color del botón de recarga
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'red', // Color del botón de cerrar
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  balanceContainer: {
    position: 'absolute',
    top: 40, // Ajusta la posición vertical según sea necesario
    right: 20, // Ajusta la posición horizontal según sea necesario
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Fondo semitransparente
    borderRadius: 5,
    padding: 10,
    elevation: 5, // Sombra para el contenedor
    zIndex: 2, // Asegúrate de que el contenedor esté por encima del mapa
  },
  balanceText: {
    color: 'black', // Color del texto
    fontSize: 16,
    fontWeight: 'bold', // Negrita
  },
  resetButton: {
    position: 'absolute',
    bottom: 20, // Ajusta la posición vertical según sea necesario
    left: 20, // Ajusta la posición horizontal según sea necesario
    backgroundColor: 'blue', // Color de fondo del botón
    padding: 10,
    borderRadius: 5,
    elevation: 5, // Sombra para el botón
  },
  resetButtonText: {
    color: 'white', // Color del texto
    fontSize: 16,
  },
  paymentModal: {
    width: '80%', // Ancho del modal
    backgroundColor: '#fff', // Fondo blanco
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5, // Sombra
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FFFFFF',
    width: '100%', // Ancho completo
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#007BFF', // Color del botón de enviar
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%', // Ancho completo
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  depositStatus: {
    marginTop: 10,
    color: 'green', // Color del mensaje de estado
    fontSize: 16,
  },
  paymentMethodModal: {
    width: '80%', // Ancho del modal
    backgroundColor: '#fff', // Fondo blanco
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5, // Sombra
  },
  paymentOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%', // Ancho completo
  },
  paymentText: {
    fontSize: 16,
    textAlign: 'center',
  },
  vehicleOptionsContainer: {
    flexDirection: 'row', // Alinear elementos en fila
    justifyContent: 'space-around', // Espacio entre los elementos
    width: '100%', // Ancho completo
    marginVertical: 10, // Espacio vertical
  },
});

// Exportación
export default MapComponent;