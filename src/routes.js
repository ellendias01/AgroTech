import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Main from "./pages/main";
import Login from "./pages/login";
import CadastrarUsuario from "./pages/cadastro";
import MovieDetails from "./pages/moviedetails";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createStackNavigator();

export default function Routes() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          title: "LOGIN",
          headerLeft: null,
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#60B665",
          },
          headerTitleStyle: {
            color: "#fff",
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="CadastrarUsuario"
        component={CadastrarUsuario}
        options={{
          title: "CADASTRO DE USUÁRIOS",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#60B665",
          },
          headerTitleStyle: {
            color: "#fff",
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="Main"
        component={Main}
        options={({ navigation }) => ({
          headerShown: false,
          headerLeft: null,
          title: "Filmes",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#60B665",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerRight: () => (
            <Ionicons
              name="log-out-outline"
              size={24}
              color="#fff"
              style={{ marginRight: 15 }}
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem("userToken");
                  navigation.replace("Login");
                } catch (error) {
                  console.error("Erro ao realizar o logout:", error);
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
  name="MovieDetails"
  component={MovieDetails}
  options={({ route }) => ({
    title: route.params?.movieTitle || "Detalhes do Filme", // Caso você passe um título via parâmetros
    headerTitleAlign: "center",
    headerStyle: {
      backgroundColor: "#191970",
    },
    headerTintColor: "#fff",
    headerTitleStyle: {
      fontWeight: "bold",
    },
  })}
/>

    </Stack.Navigator>
    
  );
}
