import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Modal, TouchableOpacity, Text, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LineChart } from 'react-native-chart-kit'; // Importa la biblioteca de gráficos

const MapComponent = () => {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [showEarnings, setShowEarnings] = useState(false); // Estado para mostrar ganancias

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setVehicleLocation(location.coords);
      setLoading(false);
    };

    getLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Datos de ejemplo para la gráfica
  const earningsData = [100, 200, 150, 300, 250, 400, 150]; // Ganancias de la semana
  const totalEarningsToday = 150; // Total de servicios hoy

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
      >
        {vehicleLocation && (
          <Marker
            coordinate={vehicleLocation}
            title={"Ubicación del Vehículo"}
            description={"Aquí está tu vehículo"}
          >
            <Image
              source={require('./assets/migo.png')}
              style={styles.vehicleImage}
              resizeMode="contain"
            />
          </Marker>
        )}
      </MapView>

     
      <TouchableOpacity style={styles.profileImageContainer} onPress={() => setModalVisible(true)}>
        <Image
          source={require('./assets/profile.png')}
          style={styles.profileImage}/>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>X</Text> 
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.profileHeader}>
              <Image
                source={require('./assets/profile.png')} 
                style={styles.modalProfileImage}/>
              <Text style={styles.profileName}>Jose Sanz</Text>
            </View>
            <TouchableOpacity style={styles.menuButton} onPress={() => setShowEarnings(!showEarnings)}>
              <Text style={styles.menuText}>Ganancias</Text>
            </TouchableOpacity>
            {showEarnings && (
              <View style={styles.earningsContainer}>
                <Text style={styles.earningsText}>Total de Servicios Hoy: ${totalEarningsToday}</Text>
                <LineChart
                  data={{
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [
                      {
                        data: earningsData,
                      },
                    ],
                  }}
                  width={300} // Ancho del gráfico
                  height={220} // Alto del gráfico
                  yAxisLabel="$" // Etiqueta del eje Y
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 2, // Cantidad de decimales
                    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: "#ffa726",
                    },
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </View>
            )}
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Viajes Programados</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Historial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Notificaciones</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Text style={styles.menuText}>Documentos</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 100,
    backgroundColor: 'transparent',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'red',
  },
  profileImage: {
    width: 50,
    height: 50,
    resizeMode: 'cover',
  },
  modalView: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    fontSize: 24,
    color: '#cb2daa',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  menuText: {
    fontSize: 16,
  },
  earningsContainer: {
    padding: 15,
  },
  earningsText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default MapComponent;
