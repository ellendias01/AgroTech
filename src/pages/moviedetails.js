import React, { Component } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";

export default class MovieDetails extends Component {
  state = {
    movieDetails: null,
    loading: true,
  };

  async componentDidMount() {
    const { movieID } = this.props.route.params;

    if (!movieID) {
      this.setState({ loading: false, movieDetails: null });
      return;
    }

    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=c56f9d8f&i=${movieID}`);
      const data = await response.json();
      this.setState({ movieDetails: data, loading: false });
    } catch (error) {
      console.error("Erro ao buscar detalhes do filme", error);
      this.setState({ loading: false });
    }
  }

  render() {
    const { movieDetails, loading } = this.state;

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e97101" />
        </View>
      );
    }

    if (!movieDetails || movieDetails.Response === "False") {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Erro ao carregar detalhes do filme.</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.posterContainer}>
          <Image source={{ uri: movieDetails.Poster }} style={styles.image} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{movieDetails.Title}</Text>
          <Text style={styles.tagline}>{movieDetails.Year} • {movieDetails.Genre}</Text>
          <Text style={styles.plot}>{movieDetails.Plot}</Text>
          <Text style={styles.text}>{`🎥 Diretor: ${movieDetails.Director}`}</Text>
          <Text style={styles.text}>{`🎭 Elenco: ${movieDetails.Actors}`}</Text>
          <Text style={styles.text}>{`🗣️ Idioma: ${movieDetails.Language}`}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  posterContainer: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#ff4500",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
    elevation: 15,
  },
  image: {
    width: 250,
    height: 370,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#e97101",
  },
  infoContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#ffcc00",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    textShadowColor: "#ff4500",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: "#ffcc00",
    marginVertical: 5,
    fontStyle: "italic",
  },
  plot: {
    fontSize: 16,
    color: "#d4d4d4",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
});
