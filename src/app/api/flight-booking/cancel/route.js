import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";


const API_KEY = process.env.API_KEY; // Store securely in .env
const prisma = new PrismaClient();
const BASE_API_URL = process.env.BASE_API_URL;
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;


export async function POST(request){


    try{
        var dataFetch =  await request.json();
    }
    catch{
        return NextResponse.json({error: "Bad Request, there is some missing values or the wrong format"}, {status: 400})
    }

    if (dataFetch.bookings.length===0){
        return NextResponse.json({error: "Bad Request"}, {status: 400})
    }
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

    //Cancel in my database
    const booking = await prisma.booking.deleteMany({
        where: {
            booking_reference: {
                in: dataFetch.bookings,
            },
            customer_id: id
        },
    });

    if (booking.count === 0) {
        return NextResponse.json({ error: "No bookings found" }, { status: 404 });
    }
    //Cancel in the external API
    var lastname = await prisma.account.findFirst({
        where: {
            account_id: parseInt(id)
        },
        select: {
            account_last_name: true
        }
    })
    if (!lastname){
        return NextResponse.json({error: "Bad request, invalid user"}, {status: 400})
    }
    lastname = lastname.account_last_name

    for (const b of dataFetch.bookings){
        const url = new URL(BASE_API_URL + "/api/bookings/cancel");
        url.searchParams.append("lastName", lastname);
        url.searchParams.append("bookingReference", b);
        console.log(url)
        const response = await fetch(url, {
            method: "POST",
            headers: {
            "x-api-key": API_KEY,
            }
        })
    
    }

    if (!response.ok) {
        return NextResponse.json({ error: "Unable to cancel booking" }, { status: 500 });
    }
    return NextResponse.json({ message: "Booking cancelled successfully" }, { status: 200 });   



    

}