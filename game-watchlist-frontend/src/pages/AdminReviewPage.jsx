import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Rating,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SimplifiedGameCard from "../components/SimplifiedGameCard";

const AdminReviewPage = () => {
  const [games, setGames] = useState([]);
  const [reviews, setReviews] = useState({});

  // Funktion, um Spiele und zugehörige Reviews zu laden
  const fetchGameAndReviewsForAdmin = async (gameId) => {
    try {
      console.log("Fetching game and reviews for gameId:", gameId);
  
      const gameResponse = await fetch(`http://localhost:5000/games/${gameId}`);
      const reviewsResponse = await fetch(`http://localhost:5000/review/${gameId}`);
  
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
  
        // Überprüfen, ob das Spiel bereits in der Liste ist
        setGames((prevGames) => {
          if (!prevGames.some((game) => game.game_id === gameData.game_id)) {
            return [...prevGames, gameData];
          }
          return prevGames;
        });
  
        console.log("Fetched game data:", gameData);
      } else {
        console.error("Failed to fetch game. Status code:", gameResponse.status);
        alert("Fehler beim Laden der Spieldaten.");
      }
  
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews((prevReviews) => ({
          ...prevReviews,
          [gameId]: reviewsData,
        }));
        console.log("Fetched reviews data:", reviewsData);
      } else if (reviewsResponse.status === 404) {
        console.warn("Keine Reviews gefunden. Status 404.");
        setReviews((prevReviews) => ({
          ...prevReviews,
          [gameId]: [],
        }));
      } else {
        console.error("Failed to fetch reviews. Status code:", reviewsResponse.status);
        alert("Fehler beim Laden der Reviews.");
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Daten:", error);
      alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
    }
  };

  // Funktion, um alle Spiele und deren Reviews zu laden
  useEffect(() => {
    const fetchAllGamesAndReviews = async () => {
      try {
        const gamesResponse = await fetch("http://localhost:5000/games");
        if (gamesResponse.ok) {
          const gamesData = await gamesResponse.json();
          setGames(gamesData);

          // Lade Reviews für jedes Spiel
          gamesData.forEach((game) => {
            fetchGameAndReviewsForAdmin(game.game_id);
          });
        } else {
          console.error("Failed to fetch games. Status code:", gamesResponse.status);
          alert("Fehler beim Laden der Spiele.");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der Spiele:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
      }
    };

    fetchAllGamesAndReviews();
  }, []);

  // Funktion, um eine Review zu löschen
  const handleDeleteReview = async (userId, gameId) => {
    if (!window.confirm("Möchtest du diese Review wirklich löschen?")) return;

    try {
      const response = await fetch(`http://localhost:5000/review/${userId}/review/${gameId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Review gelöscht!");
        fetchGameAndReviewsForAdmin(gameId); // Aktualisiere die Reviews für das Spiel
      } else {
        alert("Fehler beim Löschen der Review.");
      }
    } catch (error) {
      console.error("Fehler beim Löschen der Review:", error);
    }
  };

  return (
    <Container
  sx={{
    backgroundColor: "#f9f9f9",
    padding: 4,
    borderRadius: 2,
    boxShadow: 3,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6, // Abstand zwischen den Spielen
  }}
>
  <Typography
    variant="h4"
    sx={{
      mb: 4,
      textAlign: "center",
      fontWeight: "bold",
      color: "#333",
    }}
  >
    Admin: Spiele und zugehörige Reviews
  </Typography>
  {games.map((game) => (
    <Box
      key={game.game_id}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        borderRadius: 2,
        boxShadow: 3,
        padding: 3,
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* Simplified Game Card */}
      <SimplifiedGameCard game={game} />

      {/* Reviews Section */}
      <Box sx={{ mt: 4, width: "100%" }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: "bold",
            color: "#555",
            textAlign: "center",
          }}
        >
          Reviews:
        </Typography>
        {reviews[game.game_id]?.map((review) => (
          <Card
            key={review.user_id}
            sx={{
              boxShadow: 3,
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
              backgroundColor: "#f5f5f5",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Rating value={review.rating} readOnly precision={1} />
                <Typography
                  variant="body1"
                  sx={{ ml: 2, fontWeight: "bold", color: "#333" }}
                >
                  {review.username || "Unbekannter Benutzer"}
                </Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  color: "#444",
                }}
              >
                {review.comment}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>Plattform:</strong> {review.platform}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                <strong>Spielzeit:</strong> {review.playtime_hours} Stunden
              </Typography>
              <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              <strong>Gepostet am:</strong>{" "}
              {new Date(review.posted_at).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <IconButton
                  color="error"
                  onClick={() =>
                    handleDeleteReview(review.user_id, game.game_id)
                  }
                  sx={{
                    "&:hover": {
                      backgroundColor: "#ffcccc",
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
        {(!reviews[game.game_id] || reviews[game.game_id].length === 0) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", mt: 2 }}
          >
            Keine Reviews vorhanden.
          </Typography>
        )}
      </Box>
    </Box>
  ))}
</Container>
  )};

export default AdminReviewPage;