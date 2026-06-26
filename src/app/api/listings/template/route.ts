import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const TEMPLATE_CSV = [
  "cardName,setName,condition,price,quantity,isGraded,gradingCompany,gradeValue,isFoil,isFirstEdition,description",
  "Charizard ex,Obsidian Flames,near_mint,12500,1,FALSE,none,,FALSE,FALSE,NM - stored in sleeve since pull",
  "Pikachu VMAX,Chilling Reign,lightly_played,3800,1,FALSE,none,,FALSE,FALSE,LP minor corner wear",
  "Umbreon VMAX,Evolving Skies,near_mint,8500,1,TRUE,psa,9,FALSE,FALSE,PSA 9 certified with case",
  "Monkey D. Luffy,OP01,near_mint,4500,2,FALSE,none,,FALSE,FALSE,",
].join("\r\n");

// GET /api/listings/template — download CSV import template
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return new NextResponse(TEMPLATE_CSV, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tcgmarketph-listing-template.csv"',
    },
  });
}
