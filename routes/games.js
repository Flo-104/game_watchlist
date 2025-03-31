import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// DynamoDB Client initialisieren
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
});
const docClient = DynamoDBDocumentClient.from(client);

// ✅ Spiel erstellen
router.post("/create", async (req, res) => {
  const { title, genre, platforms, release_date, image_url, description } = req.body;

  if (!title || !genre || !platforms || platforms.length === 0 || !release_date || !image_url || !description) {
    return res.status(400).json({ error: "Fehlende Angaben!" });
  }

  try {
    const scanParams = {
      TableName: "Games",
      ProjectionExpression: "game_id",
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const gameIds = scanResult.Items.map((item) => parseInt(item.game_id, 10)).filter(Number.isFinite);
    const maxGameId = gameIds.length > 0 ? Math.max(...gameIds) : 0;

    const game_id = (maxGameId + 1).toString();

    const params = {
      TableName: "Games",
      Item: {
        game_id,
        title,
        genre,
        platforms, // Plattformen speichern
        release_date,
        image_url,
        description,
        created_at: new Date().toISOString(),
        reviews_count: 0,
        average_rating: 0,
      },
      ConditionExpression: "attribute_not_exists(game_id)",
    };

    await docClient.send(new PutCommand(params));
    res.status(201).json({ message: "Spiel erfolgreich erstellt!", game_id });
  } catch (error) {
    console.error("Fehler beim Erstellen des Spiels:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Alle Spiele abrufen
router.get("/", async (req, res) => {
  try {
    const scanParams = {
      TableName: "Games",
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    res.status(200).json(scanResult.Items || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Einzelnes Spiel abrufen
router.get("/:game_id", async (req, res) => {
  const { game_id } = req.params;

  try {
    const queryParams = {
      TableName: "Games",
      KeyConditionExpression: "game_id = :game_id",
      ExpressionAttributeValues: {
        ":game_id": game_id,
      },
    };

    const queryResult = await docClient.send(new QueryCommand(queryParams));
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return res.status(404).json({ error: "Spiel nicht gefunden!" });
    }

    res.status(200).json(queryResult.Items[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Spiel aktualisieren
router.put("/:game_id", async (req, res) => {
  const { game_id } = req.params;
  const { title, genre, platforms, release_date, image_url, description } = req.body;

  if (!title || !genre || !platforms || platforms.length === 0 || !release_date || !image_url || !description) {
    return res.status(400).json({ error: "Alle Felder sind erforderlich!" });
  }

  try {
    // Abrufen des aktuellen Spiels, um den aktuellen Sortierschlüssel (title) zu erhalten
    const queryParams = {
      TableName: "Games",
      KeyConditionExpression: "game_id = :game_id",
      ExpressionAttributeValues: {
        ":game_id": game_id,
      },
    };

    const queryResult = await docClient.send(new QueryCommand(queryParams));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return res.status(404).json({ error: "Spiel nicht gefunden!" });
    }

    const currentGame = queryResult.Items[0];
    console.log("Aktuelles Spiel:", currentGame);

    // Wenn der Titel geändert wurde, lösche das alte Element und füge ein neues hinzu
    if (currentGame.title !== title) {
      // Löschen des alten Elements
      const deleteParams = {
        TableName: "Games",
        Key: {
          game_id: game_id,
          title: currentGame.title, // Alter Titel
        },
      };

      console.log("Lösche altes Spiel:", deleteParams);
      await docClient.send(new DeleteCommand(deleteParams));

      // Hinzufügen des neuen Elements mit dem aktualisierten Titel
      const putParams = {
        TableName: "Games",
        Item: {
          game_id: game_id,
          title: title, // Neuer Titel
          genre: genre,
          platforms, // Plattformen speichern
          release_date: release_date,
          image_url: image_url,
          description: description,
          created_at: currentGame.created_at, // Behalte das ursprüngliche Erstellungsdatum
          reviews_count: currentGame.reviews_count,
          average_rating: currentGame.average_rating,
        },
      };

      console.log("Füge neues Spiel hinzu:", putParams);
      await docClient.send(new PutCommand(putParams));
    } else {
      // Wenn der Titel nicht geändert wurde, aktualisiere die anderen Felder
      const updateParams = {
        TableName: "Games",
        Key: {
          game_id: game_id,
          title: title, // Titel bleibt gleich
        },
        UpdateExpression:
          "SET genre = :genre, platforms = :platforms, release_date = :release_date, image_url = :image_url, description = :description",
        ExpressionAttributeValues: {
          ":genre": genre,
          ":platforms": platforms, // Plattformen aktualisieren
          ":release_date": release_date,
          ":image_url": image_url,
          ":description": description,
        },
        ReturnValues: "ALL_NEW",
      };

      console.log("Aktualisiere Spiel:", updateParams);
      const updateResult = await docClient.send(new UpdateCommand(updateParams));
      return res.status(200).json({ message: "Spiel erfolgreich aktualisiert!", game: updateResult.Attributes });
    }

    res.status(200).json({ message: "Spiel erfolgreich aktualisiert!" });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Spiels:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Spiel löschen
router.delete("/:game_id", async (req, res) => {
  const { game_id } = req.params;

  try {
    console.log("Lösche Spiel mit game_id:", game_id);

    // Abrufen des Spiels, um den Sortierschlüssel (title) zu erhalten
    const queryParams = {
      TableName: "Games",
      KeyConditionExpression: "game_id = :game_id",
      ExpressionAttributeValues: {
        ":game_id": game_id,
      },
    };

    const queryResult = await docClient.send(new QueryCommand(queryParams));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return res.status(404).json({ error: "Spiel nicht gefunden!" });
    }

    const game = queryResult.Items[0];
    console.log("Gefundenes Spiel:", game);

    // Löschen des Spiels
    const deleteParams = {
      TableName: "Games",
      Key: {
        game_id: game_id,
        title: game.title,
      },
    };

    console.log("Lösche Spiel aus der Games-Tabelle:", deleteParams);
    await docClient.send(new DeleteCommand(deleteParams));

    res.status(200).json({ message: "Spiel erfolgreich gelöscht!" });
  } catch (error) {
    console.error("Fehler beim Löschen des Spiels:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;