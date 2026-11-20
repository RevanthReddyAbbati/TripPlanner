// Phase 2 seam for AI. Phase 1 ships without any model calls.
//
// The plan for phase 2 (Gemini):
//   1. `suggestPlaces` asks Gemini for places at a destination that match the group's interests,
//      returned as structured JSON (`Place[]`), then merged into the destination before planning.
//   2. `refineItinerary` lets the user type a request ("swap day 3 for a Dudhsagar trip") and
//      returns edits that the deterministic engine re-times and re-costs.
//   3. `chat` answers questions about the trip with the itinerary as context.
//
// Keep the Gemini API key off the client in production: call Gemini from a small serverless
// proxy (Cloudflare Worker, Vercel or Firebase Function) and point `endpoint` at it.
import type { DayPlan, Destination, Place, Trip, TripInput } from '../../types';

export interface ItineraryEdit {
  dayIndex: number;
  day: DayPlan;
  reason: string;
}

export interface TripAIProvider {
  readonly name: string;
  suggestPlaces(destination: Destination, input: TripInput): Promise<Place[]>;
  refineItinerary(trip: Trip, request: string): Promise<ItineraryEdit[]>;
  chat(trip: Trip, question: string): Promise<string>;
}

/** Placeholder used until phase 2 wires in Gemini. */
export const noAI: TripAIProvider = {
  name: 'none',
  async suggestPlaces() {
    return [];
  },
  async refineItinerary() {
    return [];
  },
  async chat() {
    return 'The AI assistant arrives in phase 2.';
  },
};
