import React from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import icon from "/icon.png"; // Icon importieren (Pfad anpassen, falls nötig)

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#001f3f", // Dunkelblau/Marineblau
        color: "white",
        py: 2,
        textAlign: "center",
        mt: "auto", // Footer wird an das Ende des flex-Containers geschoben
        width: "100%", // Stellt sicher, dass der Footer die gesamte Breite einnimmt
      }}
    >
      <Link to="/">
        <img
          src={icon}
          alt="Logo"
          style={{
            height: "40px", // Höhe des Icons
            cursor: "pointer",
            marginBottom: "8px", // Abstand zum Text
          }}
        />
      </Link>
      <Typography variant="body2">
        © {new Date().getFullYear()} Game Watchlist. Alle Rechte vorbehalten.
      </Typography>
    </Box>
  );
};

export default Footer;