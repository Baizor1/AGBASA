import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 10MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text: string;

    switch (ext) {
      case "txt": {
        text = buffer.toString("utf-8");
        break;
      }
      case "pdf": {
        try {
          const { PDFParse } = await import("pdf-parse");
          const pdf = new PDFParse({ data: buffer });
          const result = await pdf.getText();
          text = result.text;
        } catch {
          return NextResponse.json(
            { error: "Failed to parse PDF file. Ensure it is a valid PDF." },
            { status: 400 }
          );
        }
        break;
      }
      case "docx": {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } catch {
          return NextResponse.json(
            {
              error:
                "Failed to parse DOCX file. Ensure it is a valid Word document.",
            },
            { status: 400 }
          );
        }
        break;
      }
      default: {
        return NextResponse.json(
          { error: "Unsupported file type. Use TXT, PDF, or DOCX." },
          { status: 400 }
        );
      }
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { error: "Extracted text exceeds maximum length of 50,000 characters" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
