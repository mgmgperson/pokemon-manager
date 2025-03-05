import { MongoClient, Decimal128, ObjectId } from 'mongodb';

// Connect to your local Mongo
const mongoUrl = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(mongoUrl);

// Example viability interface
export interface ViabilityDoc {
  _id: string;
  baseFormName?: string;
  baseRating?: number;  // converted from Decimal128
  fieldRatings?: Record<string, number>; // e.g. { windyFieldRating: 120.88, ... }
}

/**
 * Returns the viability doc from 'viability' collection by matching `_id` = nickname
 * Also converts any Decimal128 fields to JS numbers.
 */
export async function fetchViabilityDoc(nickname: string): Promise<ViabilityDoc | null> {
  await mongoClient.connect();
  const db = mongoClient.db('Pokenotes');
  const viabilityCollection = db.collection('viability');

  // Check if nickname is a valid ObjectId
  let query: any;
  if (ObjectId.isValid(nickname)) {
    query = { _id: new ObjectId(nickname) };
  } else {
    query = { _id: nickname };
  }

  const doc = await viabilityCollection.findOne(query) as any;
  if (!doc) return null;

  // Convert Decimal128 → number
  if (doc.fieldRatings) {
    for (const [fieldName, val] of Object.entries(doc.fieldRatings)) {
      if (val && (val as any)._bsontype === 'Decimal128') {
        doc.fieldRatings[fieldName] = parseFloat((val as Decimal128).toString());
      }
    }
  }
  if (doc.baseRating && doc.baseRating._bsontype === 'Decimal128') {
    doc.baseRating = parseFloat(doc.baseRating.toString());
  }

  return {
    ...doc,
    _id: doc._id.toString()
  } as ViabilityDoc;
}