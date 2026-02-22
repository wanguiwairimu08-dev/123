import { NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa";

export async function POST(request: Request) {
  try {
    const { phoneNumber, amount, accountRef } = await request.json();

    if (!phoneNumber || !amount || !accountRef) {
      return NextResponse.json(
        { error: "Missing required fields (phoneNumber, amount, accountRef)" },
        { status: 400 }
      );
    }

    const result = await initiateStkPush(phoneNumber, amount, accountRef);
    console.log("M-Pesa STK push result:", result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("M-Pesa API Route Error Details:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
