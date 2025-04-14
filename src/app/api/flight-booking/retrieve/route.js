import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";


const API_KEY = process.env.API_KEY; // Store securely in .env
const prisma = new PrismaClient();
const BASE_API_URL = process.env.BASE_API_URL;
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;



export async function GET(request){

    //Authentication first

    const { searchParams } = new URL(request.url);
    var bookingReference = searchParams.getAll("bookingReference"); // Extracts "37" 
    console.log(bookingReference);   

    // Verify
    const cookieStore = await cookies(); // Retrieve the cookie store
    const accessToken = await cookieStore.get("accessToken")?.value; // Await the cookies store to get the value
    if (!accessToken) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(accessToken, SECRET_KEY);
    const { id } = decoded;
    if (!id){
        return NextResponse.json({error: "Internal Error"}, { status : 500})
    }
    const flightBooking = await prisma.booking.findMany({
        where: {
            customer_id: id,
            booking_reference: {
                in: bookingReference
            }
        },

    });

    const statusMap = {};
    for (const booking of flightBooking) {
        statusMap[booking.booking_reference] = booking.status;
    }
    if (!flightBooking) {
        return NextResponse.json({ error: "Flight booking not found" }, { status: 404 });
    }
    return NextResponse.json(statusMap, { status: 200 });    

    
}