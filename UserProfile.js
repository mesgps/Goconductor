import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const UserProfile = () => {
  return (
    <View style={styles.profileContainer}>
      <Image source={require('./assets/profile.png')} style={styles.profileImage}/>
      <Text style={styles.profileName}>Nombre del Usuario</Text>
    </View>
  );
};

// Estilos para el perfil
const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Marco circular
    borderWidth: 2,
    borderColor: '#ccc', // Color del marco
  },
  profileName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserProfile;

