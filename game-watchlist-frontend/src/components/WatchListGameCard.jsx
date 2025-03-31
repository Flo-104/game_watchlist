import React, { useState } from "react";
import { Card, CardContent, CardMedia, Typography, MenuItem, Select, Button, Box, IconButton, TextField } from "@mui/material";
import RateReviewIcon from "@mui/icons-material/RateReview";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const WatchlistGameCard = ({ game, onStatusChange, onRemoveFromWatchlist }) => {
  const { userId } = useAuth();
  const [playtime, setPlaytime] = useState(game.playtime || 0);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleRemoveFromWatchlist = async (userId, gameId) => {
    try {
      const response = await fetch(`http://localhost:5000/watchlist/${userId}/${gameId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Spiel erfolgreich aus der Watchlist entfernt!");
        if (onRemoveFromWatchlist) {
          onRemoveFromWatchlist(gameId);
        } else {
          window.location.reload();
        }
      } else {
        const data = await response.json();
        alert(`Fehler: ${data.error || "Unbekannter Fehler"}`);
      }
    } catch (error) {
      console.error("Fehler beim Entfernen des Spiels aus der Watchlist:", error);
      alert("Ein Fehler ist aufgetreten.");
    }
  };

  const handleSavePlaytime = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:5000/watchlist/${userId}/update/${game.game_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playtime }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Spielstunden erfolgreich gespeichert!");
        setPlaytime(data.updatedAttributes.playtime);
      } else {
        const data = await response.json();
        console.error("Fehler beim Speichern der Spielstunden:", data.error);
        alert(`Fehler: ${data.error || "Unbekannter Fehler"}`);
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Spielstunden:", error);
      alert("Ein Fehler ist aufgetreten.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 345,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: 3,
      }}
    >
      <CardMedia
        component="img"
        image={game.image_url || "https://via.placeholder.com/300"}
        alt={game.title}
        sx={{ height: 200 }}
      />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Box>
      <Typography variant="h5" component="div" gutterBottom>
        {game.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Genre: {game.genre}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Release: {game.release_date}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
        Beschreibung: {game.description || "Keine Beschreibung verfügbar."}
      </Typography>
    </Box>

        <Box>
          <Typography variant="body2" color="text.primary" sx={{ marginBottom: 1 }}>
            Status:
          </Typography>
          <Select
            value={game.status}
            onChange={(e) => onStatusChange(game.game_id, e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            sx={{ marginBottom: 2 }}
          >
            <MenuItem value="will spielen">Will spielen</MenuItem>
            <MenuItem value="spiele gerade">Spiele gerade</MenuItem>
            <MenuItem value="fertig gespielt">Fertig gespielt</MenuItem>
          </Select>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
            <TextField
              label="Spielstunden"
              type="number"
              value={playtime}
              onChange={(e) => setPlaytime(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              disabled={game.status === "will spielen"}
            />
            <IconButton
              color="primary"
              onClick={handleSavePlaytime}
              disabled={isSaving || game.status === "will spielen"}
            >
              <CheckIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
            Du hast insgesamt <strong>{playtime} Stunden</strong> gespielt.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<RateReviewIcon />}
            onClick={() => navigate(`/review/${game.game_id}`)}
            sx={{ width: "100%", marginBottom: 2 }}
          >
            Review hinzufügen
          </Button>

          <IconButton
            color="error"
            onClick={() => handleRemoveFromWatchlist(userId, game.game_id)}
            aria-label="Aus der Watchlist entfernen"
            sx={{ width: "100%" }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WatchlistGameCard;