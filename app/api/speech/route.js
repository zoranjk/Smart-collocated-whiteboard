import formidable from 'formidable';
import fs from 'fs';
import { NextResponse } from "next/server";
import { fetchSpeechToTextFromOpenAI } from '../../lib/fetchFromOpenAi';

export async function POST(request) {
  const formData = await request.formData()
  const file = formData.get('file')

  const text = await fetchSpeechToTextFromOpenAI(file)


  return Response.json({ text: text, status: 200})
}