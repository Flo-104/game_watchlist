import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SimplifiedGameCard from "../components/SimplifiedGameCard";

const ReviewPage = () => {
  const { gameId } = useParams();
  const { userId } = useAuth();
  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState({
    rating: 0,
    comment: "",
    platform: "",
    playtime_hours: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchGameAndReviews = async () => {
    try {
      const gameResponse = await fetch(`http://localhost:5000/games/${gameId}`);
      const watchlistResponse = await fetch(`http://localhost:5000/watchlist/${userId}`);
      const reviewsResponse = await fetch(`http://localhost:5000/review/${gameId}`);
  
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
  
        if (watchlistResponse.ok) {
          const watchlistData = await watchlistResponse.json();
          const watchlistItem = watchlistData.watchlist.find(item => item.game_id === gameId);
          gameData.watchlistStatus = watchlistItem?.status || null; // Status hinzufügen
        }
  
        setGame(gameData);
      }
  
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Daten:", error);
    }
  };

  useEffect(() => {
    fetchGameAndReviews();
    console.log("Game data:", game); 
  }, [gameId, game]);

  const handleRatingChange = (event, newValue) => {
    console.log("Rating changed to:", newValue);
    setUserReview({ ...userReview, rating: newValue });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setUserReview({ ...userReview, [name]: value });
  };

  const validateReview = () => {
    const { rating, comment, platform, playtime_hours } = userReview;
    console.log("Validating review:", userReview);
    if (!rating || rating < 1 || rating > 5) {
      alert("Bitte eine gültige Bewertung zwischen 1 und 5 angeben.");
      return false;
    }
    if (!comment.trim()) {
      alert("Der Kommentar darf nicht leer sein.");
      return false;
    }
    if (!platform) {
      alert("Bitte eine Plattform auswählen.");
      return false;
    }
    if (playtime_hours < 0 || isNaN(playtime_hours)) {
      alert("Die Spielzeit muss eine positive Zahl sein.");
      return false;
    }
    return true;
  };

  const handleSubmitReview = async () => {
    if (!validateReview()) return;

    try {
      const method = isEditing ? "POST" : "POST"; // Ändere PUT zu POST
      const url = `http://localhost:5000/review/${userId}/review/${gameId}`;
      console.log("Submitting review to URL:", url);

      const { rating, comment, platform, playtime_hours } = userReview;
      const reviewData = { rating, comment, platform, playtime_hours };
      console.log("Review data being sent:", reviewData);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        console.log("Review submitted successfully.");
        alert(isEditing ? "Review aktualisiert!" : "Review hinzugefügt!");
        setIsEditing(false);
        setUserReview({ rating: 0, comment: "", platform: "", playtime_hours: 0 });
        setOpenDialog(false);

        // Seite aktualisieren, indem die Daten erneut abgerufen werden
        await fetchGameAndReviews();
      } else {
        const errorData = await response.json();
        console.error("Fehler bei der API:", errorData);
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Fehler beim Hinzufügen der Review:", error);
      alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
    }
  };

  const handleDeleteReview = async (userId, gameId) => {
    if (!userId || !gameId) {
      console.error("User ID or Game ID is undefined. Cannot delete review.");
      alert("Fehler: Benutzer-ID oder Spiel-ID fehlt.");
      return;
    }
  
    if (!window.confirm("Möchtest du diese Review wirklich löschen?")) return;
  
    try {
      const url = `http://localhost:5000/review/${userId}/review/${gameId}`;
      console.log("Deleting review with URL:", url);
  
      const response = await fetch(url, { method: "DELETE" });
  
      if (response.ok) {
        console.log("Review deleted successfully.");
        alert("Review gelöscht!");
        setReviews(reviews.filter((review) => review.user_id !== userId || review.game_id !== gameId));
      } else {
        console.error("Failed to delete review. Status code:", response.status);
        alert("Fehler beim Löschen der Review.");
      }
    } catch (error) {
      console.error("Fehler beim Löschen der Review:", error);
    }
  };

  const handleOpenDialog = (review = null) => {
    if (review) {
      console.log("Opening dialog for editing review:", review);
      setUserReview(review);
      setIsEditing(true);
    } else {
      console.log("Opening dialog for adding a new review.");
      setUserReview({ rating: 0, comment: "", platform: "", playtime_hours: 0 });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    console.log("Closing dialog.");
    setOpenDialog(false);
  };

  const userHasReview = reviews.some((review) => String(review.user_id) === String(userId));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container>
        {/* WatchlistGameCard zentrieren und vergrößern */}
        {game && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 6, // Abstand nach unten
            }}
          >
            <SimplifiedGameCard
              game={game}
              sx={{
                width: "100%",
                maxWidth: 100, // Vergrößerte Breite
                boxShadow: 4, // Schatten für mehr Tiefe
                borderRadius: 3, // Abgerundete Ecken
              }}
            />
          </Box>
        )}
  
        {/* Button für neue Reviews */}
        {/* Button für neue Reviews */}
<Box
  sx={{
    mb: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // Platz zwischen Text und Button
    gap: 2,
  }}
>
  <Typography
    variant="body2"
    color="text.secondary"
    sx={{ flexShrink: 0 }} // Verhindert, dass der Text skaliert
  >
    {!userId
      ? "Bitte melde dich an, um eine Review hinzuzufügen."
      : userHasReview
      ? "Du hast bereits eine Review hinzugefügt."
      : game?.watchlistStatus?.trim() === "Will spielen"
      ? "Das Spiel hat den Status 'Will spielen'. Ändere den Status, um eine Review hinzuzufügen."
      : ""}
  </Typography>
  <Button
    variant="contained"
    color="primary"
    startIcon={<AddIcon />}
    onClick={() => handleOpenDialog()}
    disabled={!userId || userHasReview || game?.watchlistStatus === "will spielen"}
  >
    Review hinzufügen
  </Button>
</Box>
  
        {/* Überschrift für Reviews */}
        <Typography
          variant="h5"
          sx={{
            mb: 4,
            fontWeight: "bold",
            textAlign: "center", // Zentrierte Überschrift
          }}
        >
          Alle Reviews
        </Typography>
  
        {/* Reviews-Liste */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {reviews.map((review) => (
            <Card
              key={review.id || `${review.user_id}-${review.game_id}`}
              sx={{
                boxShadow: 3,
                borderRadius: 2,
                overflow: "hidden",
                width: "120%",
                maxWidth: 800,
                mx: "auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Rating value={review.rating} readOnly precision={1} />
                  <Typography variant="body1" sx={{ ml: 2, fontWeight: "bold" }}>
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
                  }}
                >
                  {review.comment}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Plattform:</strong> {review.platform}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                {String(review.user_id).trim() === String(userId).trim() && (
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    <IconButton
                      color="secondary"
                      onClick={() => handleOpenDialog(review)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteReview(review.user_id, review.game_id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
  
        {/* Dialog für Review hinzufügen/bearbeiten */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle sx={{ fontWeight: "bold" }}>
            {isEditing ? "Review bearbeiten" : "Review hinzufügen"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Bewertung:
              </Typography>
              <Rating
                name="rating"
                value={userReview.rating}
                onChange={handleRatingChange}
                precision={1}
              />
            </Box>
            <TextField
              label="Kommentar"
              name="comment"
              value={userReview.comment}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Spielzeit (in Stunden)"
              name="playtime_hours"
              type="number"
              value={userReview.playtime_hours}
              onChange={handleInputChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Select
              name="platform"
              value={userReview.platform}
              onChange={handleInputChange}
              fullWidth
              displayEmpty
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>
                Plattform auswählen
              </MenuItem>
              <MenuItem value="PC">PC</MenuItem>
              <MenuItem value="PlayStation">PlayStation</MenuItem>
              <MenuItem value="Xbox">Xbox</MenuItem>
              <MenuItem value="Nintendo">Nintendo</MenuItem>
              <MenuItem value="Mobile">Mobile</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">
              Abbrechen
            </Button>
            <Button onClick={handleSubmitReview} color="primary" variant="contained">
              Speichern
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
export default ReviewPage;