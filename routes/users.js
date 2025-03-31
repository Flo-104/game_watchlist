import express from "express";
import { DynamoDBClient, ScanCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Überprüfen, ob AWS-Zugangsdaten vorhanden sind
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("AWS-Zugangsdaten fehlen. Bitte überprüfe die .env-Datei oder die AWS-Konfiguration.");
  process.exit(1); // Beende die Anwendung, wenn keine Zugangsdaten vorhanden sind
}

// DynamoDB Client initialisieren
const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION || "us-east-1" // Fallback-Region hinzufügen
});
const docClient = DynamoDBDocumentClient.from(client);

// Passwort-Hashing-Funktion
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// ✅ Benutzer registrieren
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Fehlende Angaben!" });
  }

  try {
    // Ermittle die höchste vorhandene user_id
    const scanParams = {
      TableName: "Users",
      ProjectionExpression: "user_id", // Nur die user_id abrufen
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    console.log("Scan result:", scanResult.Items); // Debugging: Alle vorhandenen user_id-Werte ausgeben

    // Extract and parse user_id values
    const userIds = scanResult.Items.map((item) => parseInt(item.user_id.S, 10)).filter(Number.isFinite);
    console.log("Parsed user IDs:", userIds); // Debugging: Geparste user_id-Werte ausgeben

    const maxUserId = userIds.length > 0 ? Math.max(...userIds) : 0;
    console.log("Max user ID:", maxUserId); // Debugging: Höchste user_id ausgeben

    
    const user_id = (maxUserId + 1).toString();
    console.log("New user ID:", user_id); // Debugging: Neue user_id ausgeben

    const params = {
      TableName: "Users",
      Item: {
        user_id,
        username,
        email,
        password_hash: hashPassword(password),
        created_at: new Date().toISOString(),
        is_admin: false,
      },
      ConditionExpression: "attribute_not_exists(user_id)",
    };

    await docClient.send(new PutCommand(params));
    res.status(201).json({ message: "User erfolgreich registriert!", user_id });
  } catch (error) {
    console.error("Error during registration:", error); // Debugging: Fehler ausgeben
    if (error.name === "ConditionalCheckFailedException") {
      res.status(400).json({ error: "Ein Benutzer mit dieser ID existiert bereits." });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.post("/create-admin", async (req, res) => {
    const { username, email, password, adminKey } = req.body;
  
    // Überprüfen, ob alle erforderlichen Angaben vorhanden sind
    if (!username || !email || !password || !adminKey) {
      return res.status(400).json({ error: "Fehlende Angaben!" });
    }
  
    // Überprüfen, ob der Admin-Schlüssel korrekt ist
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: "Ungültiger Admin-Schlüssel!" });
    }
  
    try {
      // Zähle die Anzahl der Benutzer, um die nächste user_id zu bestimmen
      const scanParams = {
        TableName: "Users",
        Select: "COUNT",
      };
  
      const scanResult = await docClient.send(new ScanCommand(scanParams));
      const userCount = scanResult.Count || 0;
      const user_id = `user_${userCount + 1}`; // Fortlaufende ID erstellen
  
      const params = {
        TableName: "Users",
        Item: {
          user_id,
          username,
          email,
          password_hash: hashPassword(password),
          created_at: new Date().toISOString(),
          is_admin: true, // Admin-Flag setzen
        },
        ConditionExpression: "attribute_not_exists(user_id)", // Verhindert doppelte Nutzer
      };
  
      await docClient.send(new PutCommand(params));
      res.status(201).json({ message: "Admin-Benutzer erfolgreich erstellt!", user_id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    // Debugging: Logge den Request-Body
    console.log("Request body:", req.body);
  
    // Überprüfen, ob alle erforderlichen Angaben vorhanden sind
    if (!email || !password) {
      return res.status(400).json({ error: "Fehlende Angaben!" });
    }
  
    try {
      // Suche den Benutzer anhand der E-Mail-Adresse
      const params = {
        TableName: "Users",
        FilterExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": { S: email }, // Ensure the value matches DynamoDB's expected format
        },
      };
  
      // Debugging: Logge die Abfrageparameter
      console.log("ScanCommand params:", params);
  
      const result = await docClient.send(new ScanCommand(params));
  
      // Debugging: Logge das Ergebnis der Abfrage
      console.log("ScanCommand result:", result);
  
      // Überprüfen, ob der Benutzer existiert
      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: "Benutzer nicht gefunden!" });
      }
  
      // Extrahiere den Benutzer
      const user = result.Items[0];
  
      // Extrahiere die Werte aus den DynamoDB-Objekten
      const storedPasswordHash = user.password_hash.S; // Passwort-Hash aus DynamoDB
      const hashedPassword = hashPassword(password); // Gehashtes Passwort aus der Eingabe
  
      // Überprüfen, ob das Passwort korrekt ist
      if (storedPasswordHash !== hashedPassword) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten!" });
      }
  
      // Erfolgreicher Login
      res.status(200).json({
        message: "Login erfolgreich!",
        user: {
          user_id: user.user_id.S,
          username: user.username.S,
          email: user.email.S,
          is_admin: user.is_admin.BOOL, // BOOL für Boolean-Werte
        },
      });
    } catch (error) {
      console.error("Login error:", error); // Debugging
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: "E-Mail und Passwort sind erforderlich!" });
    }
  
    try {
      const params = {
        TableName: "Users",
        FilterExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": { S: email },
        },
      };
  
      const result = await docClient.send(new ScanCommand(params));
  
      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: "Benutzer nicht gefunden!" });
      }
  
      const user = result.Items[0];
  
      if (!user.is_admin || !user.is_admin.BOOL) {
        return res.status(403).json({ error: "Zugriff verweigert! Kein Admin-Benutzer." });
      }
  
      const storedPasswordHash = user.password_hash.S;
      const hashedPassword = hashPassword(password);
  
      if (storedPasswordHash !== hashedPassword) {
        return res.status(401).json({ error: "Ungültige Anmeldedaten!" });
      }
  
      res.status(200).json({
        message: "Login erfolgreich!",
        user: {
          user_id: user.user_id.S,
          username: user.username.S,
          email: user.email.S,
          is_admin: user.is_admin.BOOL,
        },
      });
    } catch (error) {
      console.error("Fehler beim Admin-Login:", error);
      res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
    }
  });

  router.get("/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const params = {
        TableName: "Users",
        KeyConditionExpression: "user_id = :id",
        ExpressionAttributeValues: {
          ":id": id,
        },
      };
  
      const result = await docClient.send(new QueryCommand(params));
  
      if (!result.Items || result.Items.length === 0) {
        return res.status(404).json({ error: "Benutzer nicht gefunden!" });
      }
  
      const user = result.Items[0];
      res.status(200).json({
        user_id: user.user_id.S,
        username: user.username.S,
        email: user.email.S,
        is_admin: user.is_admin.BOOL, // Admin-Status
      });
    } catch (error) {
      console.error("Fehler beim Abrufen des Benutzers:", error);
      res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
    }
  });

  export default router;