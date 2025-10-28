import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://uat.finserve.africa/v3-apis/transaction-api/v3.0";
const MERCHANT_CODE = process.env.JENGA_MERCHANT_CODE!;
const API_KEY = process.env.JENGA_API_KEY!;
const API_SECRET = process.env.JENGA_API_SECRET!;

function getAuthHeader() {
  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
  return `Basic ${credentials}`;
}

async function initiateCheckout() {
  const payload = {
    merchantCode: MERCHANT_CODE,
    transactionReference: `TXN-${Date.now()}`,
    amount: 2500.0,
    currency: "KES",
    paymentChannel: "PDQ",
    narration: "Room 101 rent payment",
    billNumber: "ROOM-101",
    extraData: {
      room: "101",
      month: "Oct-2025",
      tenant: "John Doe"
    },
    callbackUrl: "https://yourdomain.com/api/ipn",
    successRedirectUrl: "https://yourdomain.com/payment-success",
    failRedirectUrl: "https://yourdomain.com/payment-fail",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      mobileNumber: "254712345678"
    }
  };

  try {
    const res = await axios.post(`${BASE_URL}/checkout`, payload, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Checkout initiated successfully:");
    console.log(res.data);
  } catch (err: any) {
    console.error("❌ Error initiating checkout:");
    if (err.response) console.error(err.response.data);
    else console.error(err.message);
  }
}

initiateCheckout();
