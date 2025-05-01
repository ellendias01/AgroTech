import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/*falta a parte do login pra arrumar*/
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      // Recupera a lista de usuários salvos
      const usersData = await AsyncStorage.getItem("users");
      const users = usersData ? JSON.parse(usersData) : [];
  
      // Verifica se existe um usuário com o email e senha fornecidos
      const foundUser = users.find(
        (user) => user.email === email && user.password === password
      );
  
      if (foundUser) {
        // Armazena o email do usuário logado
        await AsyncStorage.setItem("userId", foundUser.email);
        navigation.navigate("Main");
      } else {
        Alert.alert("Erro", "E-mail ou senha inválidos!");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao recuperar os dados!");
    }
  };

  const handleCadastro = () => {
    navigation.navigate("CadastrarUsuario");
  };

  return (
    <View style={styles.container}>
      {/* Logo mais acima */}
      <Image 
        source={require("./img/logo.png")} // Ajuste o caminho correto da imagem
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Campo de E-mail */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Campo de Senha */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Botão de Entrar */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      {/* Botão de Cadastro */}
      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // Mantém os elementos centralizados
    backgroundColor: "#fff",
    gap: 15, // Espaçamento entre os elementos
  },
  logo: {
    width: 300, // Ajuste o tamanho conforme necessário
    height: 300,
    marginTop: -150, // Move a logo para cima
  },
  inputContainer: {
    width: "80%", // Garante que o input e o label fiquem alinhados
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    width: "100%",
  },
  button: {
    backgroundColor: "#60B665",
    borderRadius: 10,
    padding: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Login;
