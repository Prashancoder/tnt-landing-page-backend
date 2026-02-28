const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/*
  CORS Configuration
  Allow:
  - Localhost (development)
  - Production frontend (set FRONTEND_URL in Render env if needed)
*/

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL, // optional production frontend URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

const CRM_BASE_URL =
  "https://ttr171-api.iqsetter.com/crm/lead/create?authkey=";

app.post("/api/lead", async (req, res) => {
  console.log("[/api/lead] Incoming request:", req.body);

  try {
    const {
      name,
      email,
      phone,
      message,
      property_project_name = "Orchid IVY - Sector 51 Gurugram",
    } = req.body || {};

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: "Name and phone are required",
      });
    }

    const authKey = process.env.CRM_AUTH_KEY;

    if (!authKey) {
      console.error("CRM_AUTH_KEY missing in environment variables");
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

    console.log("Sending to CRM:", crmPayload);

    const crmResponse = await fetch(crmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(crmPayload),
    });

    let crmData;
    try {
      crmData = await crmResponse.json();
    } catch (err) {
      console.error("Error parsing CRM response:", err);
      return res.status(500).json({
        success: false,
        error: "Invalid CRM response",
      });
    }

    if (!crmResponse.ok) {
      console.error("CRM returned error:", crmData);
      return res.status(500).json({
        success: false,
        error: "Failed to create lead in CRM",
        details: crmData,
      });
    }

    return res.status(200).json({
      success: true,
      crmResponse: crmData,
    });
  } catch (error) {
    console.error("Unexpected server error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});