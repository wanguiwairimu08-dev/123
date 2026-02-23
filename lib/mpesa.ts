export async function getMpesaToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const isProduction = process.env.MPESA_ENV === "production";

  if (!consumerKey || !consumerSecret) {
    // If we are in dev and missing credentials, we can't get a real token
    // For local development or preview, we return a mock token
    console.warn("M-Pesa credentials not found. Using simulator mode.");
    return "simulated_token";
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = isProduction
    ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`M-Pesa token generation failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function initiateStkPush(phoneNumber: string, amount: number, accountRef: string) {
  const isProduction = process.env.MPESA_ENV === "production";
  const consumerKey = process.env.MPESA_CONSUMER_KEY;

  if (!consumerKey) {
    // Simulate a successful response for preview/demo purposes
    console.warn("M-Pesa credentials missing. Simulating STK push for:", phoneNumber);
    return {
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      MerchantRequestID: `sim_${Date.now()}`,
      CheckoutRequestID: `sim_chk_${Date.now()}`,
      CustomerMessage: "Please enter your M-Pesa pin on your phone to complete the payment."
    };
  }

  const token = await getMpesaToken();

  // Default values from user's provided Till details
  const shortCode = process.env.MPESA_SHORTCODE || "7645148"; // Store Number
  const tillNumber = process.env.MPESA_TILL_NUMBER || "3234101"; // Till Number
  const passkey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const receiverNumber = process.env.MPESA_RECEIVER_NUMBER || "0117808581";

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

  // Format phone number to 254...
  let formattedPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith("254") && formattedPhone.length === 9) {
    formattedPhone = "254" + formattedPhone;
  }

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: isProduction ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: isProduction ? tillNumber : shortCode, // In sandbox, PartyB is usually same as ShortCode
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL || "https://mydomain.com/api/mpesa/callback",
    AccountReference: accountRef,
    TransactionDesc: `Payment for ${accountRef} to ${receiverNumber}`,
  };

  const url = isProduction
    ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("M-Pesa API Response Body:", errorText);
    console.error("M-Pesa API Payload:", JSON.stringify(payload, null, 2));
    throw new Error(`M-Pesa STK push initiation failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}
