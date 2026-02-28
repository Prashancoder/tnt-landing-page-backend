const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

const CRM_BASE_URL =
  "https://ttr171-api.iqsetter.com/crm/lead/create?authkey=";

app.post("/api/lead", async (req, res) => {
  console.log("[/api/lead] Incoming request body:", req.body);

  try {
    const {
      name,
      email,
      phone,
      message,
      property_project_name = "Orchid IVY - Sector 51 Gurugram",
    } = req.body || {};

    if (!name || !phone) {
      console.warn("[/api/lead] Missing required fields: name or phone");
      return res.status(400).json({
        success: false,
        error: "Name and phone are required",
      });
    }

    const authKey = process.env.CRM_AUTH_KEY;

    if (!authKey) {
      console.error("[/api/lead] CRM_AUTH_KEY is not set in environment");
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

    console.log("[/api/lead] Forwarding payload to CRM:", crmPayload);
    console.log("[/api/lead] CRM URL:", crmUrl);

    const crmResponse = await fetch(crmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(crmPayload),
    });

    const crmData = await crmResponse.json().catch((erFr) => {
      console.error("[/api/lead] Error parsing CRM JSON:", err);
      throw new Error("Failed to parse CRM response");
    });

    console.log("[/api/lead] CRM raw response:", crmData);

    if (!crmResponse.ok) {
      console.error("[/api/lead] CRM responded with non-2xx status:", {
        status: crmResponse.status,
        statusText: crmResponse.statusText,
        data: crmData,
      });
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
    console.error("[/api/lead] Unexpected server error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

