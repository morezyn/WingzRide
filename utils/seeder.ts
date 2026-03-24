import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { db } from '../config/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { StandingOrder } from '../types';

export const pickAndUploadCSV = async (): Promise<boolean> => {
  try {
    // 1. Pick the file with broad MIME type support to prevent "greyed out" files
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/csv', 
        'text/comma-separated-values', 
        'text/plain', 
        'application/vnd.ms-excel', 
        '*/*'
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return false;

    const fileUri = result.assets[0].uri;
    const response = await fetch(fileUri);
    const csvText = await response.text();

    // 2. Parse CSV with Flexible Mapping
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const batch = writeBatch(db);
            const ordersRef = collection(db, "standing_orders");

            // Log headers to terminal for debugging if needed
            if (results.data.length > 0) {
              console.log("Detected Headers:", Object.keys(results.data[0]));
            }

            results.data.forEach((row: any) => {
              // Flexible check for Order ID (the unique key)
              const id = row["Order ID"] || row["Order I"] || row["orderId"];
              if (!id) return;

              // Map data using "||" logic to handle truncated vs full headers
              // This prevents the "Unsupported field value: undefined" error
              const order: StandingOrder = {
                tripId: row["Trip ID"] || row["Trip I"] || "",
                orderId: id.toString(),
                clientOrg: row["Client Org"] || row["Client O"] || "",
                
                patientName: row["Rider Nam"] || row["Rider Name"] || "Unknown",
                phone: row["Phone"] || "N/A",

                // Pickup Details
                pickupStreet: row["Pickup Stre"] || row["Pickup Street"] || "",
                pickupCity: row["Pickup City"] || "",
                pickupCounty: row["Pickup Cou"] || row["Pickup County"] || "",
                pickupZip: row["Pickup Zip"] || "",

                // Dropoff Details
                dropoffStreet: row["Dropoff Str"] || row["Dropoff Street"] || "",
                dropoffCity: row["Dropoff Cit"] || row["Dropoff City"] || "",
                dropoffCounty: row["Dropoff Co"] || row["Dropoff County"] || "",
                dropoffZip: row["Dropoff Zip"] || "",

                // Schedule (Handling "M W F" format)
                scheduleDays: (row["Schedule D"] || row["Schedule Days"] || "").split(' '),
                pickupTimeA: row["Pickup Tim"] || row["Pickup Time A"] || "",
                // PapaParse appends _1 to duplicate header names (like the second 'Pickup Tim')
                pickupTimeB: row["Pickup Tim_1"] || row["Pickup Time B"] || "",

                // Logistics
                mobilityType: row["Mobility Ty"] || row["Mobility Type"] || "Ambulatory",
                vehicleRequired: row["Vehicle Re"] || row["Vehicle Required"] || "Sedan/Van",
                isWAV: (row["Vehicle Re"] || row["Vehicle Required"])?.trim().toUpperCase() === "WAV",

                // Financials & Distances (Ensuring they are numbers, not strings)
                aMiles: parseFloat(row["A Miles"]) || 0,
                bMiles: parseFloat(row["B Miles"]) || 0,
                totalMiles: parseFloat(row["Total Mil"]) || parseFloat(row["Total Miles"]) || 0,
                estFare: parseFloat(row["Est. Fare"]) || parseFloat(row["Est. Fare (USD)"]) || 0,

                // System Defaults
                status: "pending",
                createdAt: new Date().toISOString()
              };

              const docRef = doc(ordersRef, order.orderId);
              batch.set(docRef, order);
            });

            await batch.commit();
            resolve(true);
          } catch (dbError) {
            console.error("Firestore Batch Error:", dbError);
            reject(dbError);
          }
        },
        error: (error) => reject(error),
      });
    });
  } catch (error) {
    console.error("CSV Import Logic Error:", error);
    throw error;
  }
};