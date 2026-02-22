export async function getMpesaToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not found in environment variables.");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`M-Pesa token generation failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function initiateStkPush(phoneNumber: string, amount: number, accountRef: string) {
  const token = await getMpesaToken();
  const shortCode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const receiverNumber = process.env.MPESA_RECEIVER_NUMBER || "0707444525";
  
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

  // Format phone number to 254...
  let formattedPhone = phoneNumber.replace(/\+/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith("254")) {
    formattedPhone = "254" + formattedPhone;
  }

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: shortCode,
    PhoneNumber: formattedPhone,
    CallBackURL: "https://mydomain.com/path", // This would be a real URL in production
    AccountReference: accountRef,
    TransactionDesc: `Payment for ${accountRef} to ${receiverNumber}`,
  };

  const response = await fetch(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("M-Pesa API Response Body:", errorText);
    console.error("M-Pesa API Payload:", JSON.stringify(payload, null, 2));
    throw new Error(`M-Pesa STK push initiation failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}
