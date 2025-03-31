import React, { useEffect, useState } from "react";
import { Grid, Container, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import WatchlistGameCard from "../components/WatchListGameCard";

const Watchlist = () => {
  const { userId, isLoggedIn } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      alert("Bitte logge dich ein, um deine Watchlist zu sehen.");
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/watchlist/${userId}`);
        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen der Watchlist: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("API-Antwort:", data);

        if (data && Array.isArray(data.watchlist)) {
          const transformedData = data.watchlist.map((item) => ({
            game_id: item.game_data?.game_id || item.game_id,
            title: item.game_data?.title || item.title,
            genre: item.game_data?.genre || item.genre,
            release_date: item.game_data?.release_date || item.release_date,
            description: item.game_data?.description || item.description,
            image_url: item.game_data?.image_url || item.image_url,
            status: item.status,
            playtime: item.playtime || 0, // Spielstunden hinzufügen
          }));
          setWatchlist(transformedData);
        } else {
          console.error("Unerwartetes Datenformat:", data);
          setWatchlist([]);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Watchlist:", error);
        setWatchlist([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [isLoggedIn, userId]);

  const handleStatusChange = async (gameId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/watchlist/${userId}/update-status/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert("Status erfolgreich aktualisiert!");
        setWatchlist((prev) =>
          prev.map((game) =>
            game.game_id === gameId ? { ...game, status: newStatus } : game
          )
        );
      } else {
        const data = await response.json();
        alert(`Fehler: ${data.error || "Unbekannter Fehler"}`);
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Status:", error);
    }
  };

  const handleAddReview = (game) => {
    alert(`Review für ${game.title} hinzufügen`);
    // Hier kannst du eine Modal- oder Formular-Komponente öffnen, um die Review hinzuzufügen.
  };

  if (loading) {
    return <Typography align="center" sx={{ mt: 10, color: "gray" }}>Lade Watchlist...</Typography>;
  }

  if (!Array.isArray(watchlist) || watchlist.length === 0) {
    return (
      <Typography align="center" sx={{ mt: 10, color: "gray" }}>
        Deine Watchlist ist leer. Füge Spiele hinzu, um sie hier zu sehen!
      </Typography>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Deine Watchlist
      </Typography>
      <Grid container spacing={4}>
        {watchlist.map((game) => (
          <Grid item key={game.game_id} xs={12} sm={6} md={4}>
            <WatchlistGameCard
              game={game}
              onStatusChange={handleStatusChange}
              onAddReview={handleAddReview}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Watchlist;