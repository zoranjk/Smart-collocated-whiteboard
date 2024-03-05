// app/api/route.js 
// Deafult "/api" route

import { NextResponse } from "next/server";

// To handle a GET request to /api
export async function GET(request) {
  // Do whatever you want
  return NextResponse.json({ message: "Hello World" }, { status: 200 });
}

// To handle a POST request to /api
export async function POST(request) {

  const { text } = await request.json();
  console.log('POST request text: ', text);

  // Do whatever you want
  return NextResponse.json({ message: "Hello world!" }, { status: 200 });
}