import express from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// DynamoDB Client initialisieren
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
});
const docClient = DynamoDBDocumentClient.from(client);

// Middleware zur Überprüfung, ob `user_id` existiert
const validateUser = async (req, res, next) => {
  const { user_id } = req.params;

  try {
    const params = {
      TableName: "Users", // Tabelle, die Benutzer speichert
      KeyConditionExpression: "user_id = :user_id",
      ExpressionAttributeValues: {
        ":user_id": user_id,
      },
    };

    const result = await docClient.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden!" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware zur Überprüfung, ob `game_id` existiert
const validateGame = async (req, res, next) => {
  const { game_id } = req.params;

  try {
    const params = {
      TableName: "Games", // Tabelle, die Spiele speichert
      KeyConditionExpression: "game_id = :game_id",
      ExpressionAttributeValues: {
        ":game_id": game_id,
      },
    };

    const result = await docClient.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ error: "Spiel nicht gefunden!" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Spiel zur Watchlist hinzufügen
router.post("/:user_id", validateUser, async (req, res) => {
  const { user_id } = req.params;
  const { game_id, status } = req.body;

  if (!game_id) {
    return res.status(400).json({ error: "Spiel-ID fehlt." });
  }

  if (!status || !["will spielen", "spiele gerade", "fertig gespielt"].includes(status)) {
    return res.status(400).json({ error: "Ungültiger Status! Erlaubte Werte: 'will spielen', 'spiele gerade', 'fertig gespielt'." });
  }

  try {
    const params = {
      TableName: "Watchlist",
      Item: {
        user_id, // Partition key
        game_id, // Sort key
        status, // Status des Spiels
        playtime: 0, // Standardwert für Spielzeit
        added_at: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(game_id)", // Verhindert doppelte Einträge
    };

    await docClient.send(new PutCommand(params));
    res.status(201).json({ message: "Spiel erfolgreich zur Watchlist hinzugefügt!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Watchlist eines Benutzers anzeigen (mit Spieldaten und Spielzeit)
router.get("/:user_id", validateUser, async (req, res) => {
  const { user_id } = req.params;

  try {
    const params = {
      TableName: "Watchlist",
      KeyConditionExpression: "user_id = :user_id",
      ExpressionAttributeValues: {
        ":user_id": user_id,
      },
    };

    const watchlistResult = await docClient.send(new QueryCommand(params));

    const enrichedWatchlist = await Promise.all(
      (watchlistResult.Items || []).map(async (item) => {
        const gameParams = {
          TableName: "Games",
          KeyConditionExpression: "game_id = :game_id",
          ExpressionAttributeValues: {
            ":game_id": item.game_id,
          },
        };
    
        const gameResult = await docClient.send(new QueryCommand(gameParams));
    
        return {
          ...item,
          game_data: gameResult.Items && gameResult.Items.length > 0 ? gameResult.Items[0] : null,
        };
      })
    );

    res.status(200).json({ watchlist: enrichedWatchlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Spiel aus der Watchlist entfernen
router.delete("/:user_id/:game_id", validateUser, async (req, res) => {
  const { user_id, game_id } = req.params;

  try {
    const params = {
      TableName: "Watchlist",
      Key: {
        user_id,
        game_id,
      },
    };

    await docClient.send(new DeleteCommand(params));
    res.status(200).json({ message: "Spiel erfolgreich aus der Watchlist entfernt!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Status eines Spiels aktualisieren
router.put("/:user_id/update-status/:game_id", validateUser, validateGame, async (req, res) => {
  const { user_id, game_id } = req.params;
  const { status } = req.body;

  if (!status || !["will spielen", "spiele gerade", "fertig gespielt"].includes(status)) {
    return res.status(400).json({ error: "Ungültiger Status! Erlaubte Werte: 'will spielen', 'spiele gerade', 'fertig gespielt'." });
  }

  try {
    const params = {
      TableName: "Watchlist",
      Key: {
        user_id, // Partition key
        game_id, // Sort key
      },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await docClient.send(new UpdateCommand(params));

    res.status(200).json({
      message: "Status erfolgreich aktualisiert!",
      watchlistItem: result.Attributes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Spielstunden aktualisieren
router.patch("/:user_id/update/:game_id", async (req, res) => {
  const { user_id, game_id } = req.params;
  const { playtime } = req.body;

  if (!playtime || isNaN(playtime)) {
    return res.status(400).json({ error: "Ungültige Spielstunden!" });
  }

  try {
    const params = {
      TableName: "Watchlist",
      Key: {
        user_id,
        game_id,
      },
      UpdateExpression: "SET playtime = :playtime",
      ExpressionAttributeValues: {
        ":playtime": Number(playtime),
      },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await docClient.send(new UpdateCommand(params));
    res.status(200).json({ message: "Spielstunden erfolgreich aktualisiert!", updatedAttributes: result.Attributes });
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Spielstunden:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;