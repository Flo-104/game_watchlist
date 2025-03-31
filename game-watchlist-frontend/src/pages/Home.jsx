import React, { useEffect, useState } from "react";
import {
  Grid,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
} from "@mui/material";
import GameCard from "../components/GameCard";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const [games, setGames] = useState([]);
  const { isLoggedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [selectedStars, setSelectedStars] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]); // Mehrfachauswahl

  // Formulardaten für das Hinzufügen eines Spiels
  const [newGame, setNewGame] = useState({
    title: "",
    genre: "",
    platforms: [], // Mehrere Plattformen
    release_date: "",
    image_url: "",
    description: "",
  });

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("http://localhost:5000/games");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setGames(data);
      } catch (error) {
        console.error("Fehler beim Laden der Spiele:", error);
      }
    };

    const fetchAdminStatus = () => {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      setIsAdmin(adminStatus);
    };

    fetchGames();
    if (isLoggedIn) {
      fetchAdminStatus();
    }
  }, [isLoggedIn]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGame({ ...newGame, [name]: value });
  };

  const handlePlatformChange = (event) => {
    const { value } = event.target;
    setNewGame({ ...newGame, platforms: typeof value === "string" ? value.split(",") : value });
  };

  const handleFilterPlatformChange = (event) => {
    const { value } = event.target;
    setSelectedPlatforms(typeof value === "string" ? value.split(",") : value);
  };

  const handleAddGame = async () => {
    // Überprüfen, ob alle Felder ausgefüllt sind
    if (
      !newGame.title.trim() ||
      !newGame.genre.trim() ||
      newGame.platforms.length === 0 ||
      !newGame.release_date.trim() ||
      !newGame.image_url.trim() ||
      !newGame.description.trim()
    ) {
      alert("Bitte fülle alle Felder aus!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newGame,
          platforms: newGame.platforms.map((platform) => platform.trim()), // Plattformen bereinigen
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Spiel erfolgreich hinzugefügt!");
        setGames((prevGames) => [...prevGames, { ...newGame, game_id: data.game_id }]);
        setOpen(false);
        setNewGame({
          title: "",
          genre: "",
          platforms: [],
          release_date: "",
          image_url: "",
          description: "",
        });
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error || "Unbekannter Fehler"}`);
      }
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Spiels:", error);
      alert("Ein Fehler ist aufgetreten.");
    }
  };

  const filteredGames = games.filter((game) => {
    const matchesSearchTerm = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = game.genre.toLowerCase().includes(searchGenre.toLowerCase());
    const matchesStars = selectedStars ? Math.round(game.average_rating || 0) === parseInt(selectedStars) : true;
    const matchesPlatforms =
      selectedPlatforms.length === 0 ||
      selectedPlatforms.some((platform) => (game.platforms || []).includes(platform)); // Fallback auf leeres Array

    return matchesSearchTerm && matchesGenre && matchesStars && matchesPlatforms;
  });

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Alle Spiele
      </Typography>

      {/* Filtermenü */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Nach Name suchen"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
        <TextField
          label="Nach Genre suchen" // Neues Eingabefeld für Genre
          variant="outlined"
          fullWidth
          value={searchGenre}
          onChange={(e) => setSearchGenre(e.target.value)}
        />
      </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth sx={{ minWidth: 200 }}>
            <InputLabel>Anzahl Sterne</InputLabel>
            <Select
              value={selectedStars}
              onChange={(e) => setSelectedStars(e.target.value)}
            >
              <MenuItem value="">Alle</MenuItem>
              <MenuItem value={1}>1 Stern</MenuItem>
              <MenuItem value={2}>2 Sterne</MenuItem>
              <MenuItem value={3}>3 Sterne</MenuItem>
              <MenuItem value={4}>4 Sterne</MenuItem>
              <MenuItem value={5}>5 Sterne</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth sx={{ minWidth: 200 }}>
            <InputLabel>Plattform</InputLabel>
            <Select
              multiple
              value={selectedPlatforms}
              onChange={handleFilterPlatformChange}
              renderValue={(selected) => selected.join(", ")}
            >
              <MenuItem value="PC">
                <Checkbox checked={selectedPlatforms.includes("PC")} />
                <ListItemText primary="PC" />
              </MenuItem>
              <MenuItem value="PlayStation">
                <Checkbox checked={selectedPlatforms.includes("PlayStation")} />
                <ListItemText primary="PlayStation" />
              </MenuItem>
              <MenuItem value="Xbox">
                <Checkbox checked={selectedPlatforms.includes("Xbox")} />
                <ListItemText primary="Xbox" />
              </MenuItem>
              <MenuItem value="Nintendo Switch">
                <Checkbox checked={selectedPlatforms.includes("Nintendo Switch")} />
                <ListItemText primary="Nintendo Switch" />
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {isAdmin && (
        <Button variant="contained" color="primary" onClick={() => setOpen(true)} sx={{ marginBottom: 2 }}>
          Spiel hinzufügen
        </Button>
      )}

      <Grid container spacing={4}>
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <Grid item key={game.game_id} xs={12} sm={6} md={4}>
              <GameCard game={game} />
            </Grid>
          ))
        ) : (
          <Typography variant="h6" align="center" sx={{ width: "100%", mt: 4 }}>
            Keine Spiele gefunden.
          </Typography>
        )}
      </Grid>

      {/* Dialog für das Hinzufügen eines Spiels */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Neues Spiel hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            label="Titel"
            name="title"
            value={newGame.title}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Genre"
            name="genre"
            value={newGame.genre}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Plattform</InputLabel>
            <Select
              multiple
              name="platforms"
              value={newGame.platforms}
              onChange={handlePlatformChange}
              renderValue={(selected) => selected.join(", ")}
            >
              <MenuItem value="PC">PC</MenuItem>
              <MenuItem value="PlayStation">PlayStation</MenuItem>
              <MenuItem value="Xbox">Xbox</MenuItem>
              <MenuItem value="Nintendo Switch">Nintendo Switch</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Release-Datum"
            name="release_date"
            type="date"
            value={newGame.release_date}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Bild-URL"
            name="image_url"
            value={newGame.image_url}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Beschreibung"
            name="description"
            value={newGame.description}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary">
            Abbrechen
          </Button>
          <Button onClick={handleAddGame} color="primary" variant="contained">
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Home;