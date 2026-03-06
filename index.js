const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/*
  ============================
  CORS CONFIGURATION
  ============================
*/

const allowedOrigins = [
  "https://www.orchid-ivy.com",
  "https://orchid-ivy.com",
  "https://www.ocusmedley.in",
  "https://ocusmedley.in",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/*
  ============================
  CRM CONFIG
  ============================
*/

const CRM_BASE_URL =
  "https://ttr171-api.iqsetter.com/crm/lead/create?authkey=";

/*
  ============================
  LEAD API
  ============================
*/

app.post("/api/lead", async (req, res) => {
  console.log("Incoming Lead:", req.body);

  try {
    const {
      name,
      email,
      phone,
      message,
      property_project_name = "Orchid IVY - Sector 51 Gurugram",
    } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: "Name and phone are required",
      });
    }

    const authKey = process.env.CRM_AUTH_KEY;

    if (!authKey) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    const crmUrl = `${CRM_BASE_URL}${authKey}`;

    const crmPayload = {
      connector_guid: "d3554968d7df460191eb4273a4dc8b08",
      first_name: name,
      last_name: "",
      comment: message || "Website Inquiry - Orchid IVY",
      mobile_number: phone,
      email_address: email || "",
      property_project_name,
    };

    const crmResponse = await fetch(crmUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(crmPayload),
    });

    const crmData = await crmResponse.json();

    if (!crmResponse.ok) {
      return res.status(500).json({
        success: false,
        error: "CRM error",
        details: crmData,
      });
    }

    return res.status(200).json({
      success: true,
      crmResponse: crmData,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/*
  ============================
  HEALTH CHECK
  ============================
*/

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/*
  ============================
  START SERVER
  ============================
*/

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
