import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "campaign-metadata.json"
);

/**
 * Ensure data file exists
 */
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([]));
  }
}

/**
 * Read metadata file
 */
function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * Write metadata file
 */
function writeData(data: any) {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

/**
 * POST - Save campaign metadata
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      campaignId,
      title,
      description,
      imageUrl,
      videoUrl,
      goal,
      deadline,
    } = body;

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId is required" },
        { status: 400 }
      );
    }

    const data = readData();

    const newEntry = {
      campaignId: campaignId.toString(),
      title: title || "",
      description: description || "",
      imageUrl: imageUrl || "",
      videoUrl: videoUrl || "",
      goal: goal || "",
      deadline: deadline || null,
      createdAt: Date.now(),
    };

    const existingIndex = data.findIndex(
      (item: any) => item.campaignId === campaignId.toString()
    );

    if (existingIndex >= 0) {
      data[existingIndex] = newEntry;
    } else {
      data.push(newEntry);
    }

    writeData(data);

    // 🔥 Aqui depois você substituirá por pinagem real no Pinata
    const mockUri = `ipfs://mock-cid-${campaignId}`;

    return NextResponse.json({
      uri: mockUri,
      metadata: newEntry,
    });
  } catch (error) {
    console.error("[CampaignMetadataAPI] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve metadata by campaignId
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    const data = readData();

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId query param is required" },
        { status: 400 }
      );
    }

    const entry = data.find(
      (item: any) => item.campaignId === campaignId.toString()
    );

    if (!entry) {
      return NextResponse.json(
        { message: "Metadata not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("[CampaignMetadataAPI] GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete specific campaign metadata
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId query param is required" },
        { status: 400 }
      );
    }

    const data = readData();
    const filtered = data.filter(
      (item: any) => item.campaignId !== campaignId.toString()
    );

    writeData(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CampaignMetadataAPI] DELETE error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}